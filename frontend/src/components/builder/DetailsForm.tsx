'use client';

import { useState, useEffect, useMemo } from 'react';
import { Template, FormField } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DetailsFormProps {
  template: Template;
}

export default function DetailsForm({ template }: DetailsFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ---------------- FIELD GROUPING (AUTO) ---------------- */
  const steps = useMemo(() => {
    const required = template.formSchema.filter(f => f.required);

    return [
      { label: 'Basic', fields: required.slice(0, Math.ceil(required.length / 2)) },
      { label: 'Content', fields: required.slice(Math.ceil(required.length / 2)) },
    ];
  }, [template]);

  const currentFields = steps[step]?.fields || [];

  /* ---------------- INPUT ---------------- */
  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));

    if (errors[id]) {
      const copy = { ...errors };
      delete copy[id];
      setErrors(copy);
    }
  };

  /* ---------------- LIVE PREVIEW ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setPreviewData(formData), 150);
    return () => clearTimeout(t);
  }, [formData]);

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    currentFields.forEach(f => {
      if (!formData[f.id]?.trim()) {
        newErrors[f.id] = 'Required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    setIsBuilding(true);

    const siteId = 'site_' + Math.random().toString(36).slice(2, 10);

    try {
      await api.sites.create(template.id, siteId, formData);
      router.push('/dashboard');
    } catch (err) {
      console.error('Build error:', err);
      setIsBuilding(false);
    }
  };

  /* ---------------- FIELD RENDER ---------------- */
  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    if (field.type === 'textarea') {
      return (
        <Textarea
          key={field.id}
          label={field.label}
          value={value}
          onChange={(e) => handleChange(field.id, e.target.value)}
          error={error}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          key={field.id}
          label={field.label}
          options={field.options || []}
          value={value}
          onChange={(e) => handleChange(field.id, e.target.value)}
          error={error}
        />
      );
    }

    return (
      <Input
        key={field.id}
        label={field.label}
        value={value}
        onChange={(e) => handleChange(field.id, e.target.value)}
        error={error}
      />
    );
  };

  /* ---------------- BUILD STATE ---------------- */
  if (isBuilding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <div className="text-center">
          <h3 className="text-white font-medium text-lg">Creating your site...</h3>
          <p className="text-zinc-500 text-sm mt-2">You will be redirected to your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">

      {/* HEADER */}
      <div className="mb-6">
        <Link href="/builder/templates" className="text-sm text-zinc-500 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Templates
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          <div>
            <h1 className="text-xl font-semibold text-white">{template.name}</h1>
            <p className="text-sm text-zinc-500">Quick setup</p>
          </div>

          <Card className="p-6 border border-zinc-800 bg-zinc-900/60">

            {/* STEP SWITCH */}
            <div className="flex gap-2 mb-6">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 text-xs rounded-md ${
                    i === step ? 'bg-zinc-800 text-white' : 'text-zinc-500'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* FIELDS */}
            <div className="grid md:grid-cols-2 gap-4">
              {currentFields.map(renderField)}
            </div>

            {/* ACTION */}
            <div className="flex justify-between mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep(s => s - 1)}
                className="text-zinc-400"
              >
                Back
              </Button>

              <Button
                onClick={() => {
                  if (!validate()) return;
                  step === steps.length - 1 ? handleSubmit() : setStep(s => s + 1);
                }}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {step === steps.length - 1 ? 'Build Site' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

          </Card>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="space-y-4">

          <Card className="overflow-hidden border border-zinc-800 bg-zinc-900/60">
            <div className="aspect-[4/3] relative">

              <img
                src={template.thumbnail}
                className="w-full h-full object-cover opacity-40"
              />

              {/* LIVE OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 p-4 flex flex-col justify-end">

                <h2 className="text-white text-lg font-semibold">
                  {previewData.companyName || 'Your Company'}
                </h2>

                <p className="text-sm text-zinc-300">
                  {previewData.heroSubtitle || 'Your tagline'}
                </p>

                <div className="mt-2 text-xs text-zinc-400">
                  {previewData.email || 'contact@email.com'}
                </div>

              </div>
            </div>
          </Card>

          {/* FEATURES */}
          {/* <div className="space-y-2">
            {template.features.map((f) => (
              <div key={f} className="flex gap-2 text-sm text-zinc-400">
                <Check className="w-4 h-4 text-emerald-400" />
                {f}
              </div>
            ))}
          </div> */}

        </div>

      </div>
    </div>
  );
}