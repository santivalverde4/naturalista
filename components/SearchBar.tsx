'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newParams = new URLSearchParams(searchParams.toString());
    const value = e.target.value.trim();

    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }

    startTransition(() => {
      router.replace(`/?${newParams.toString()}`);
    });
  }

  return (
    <div className="relative mb-4">
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Buscar por familia, género o especie..."
        className={`
          w-full bg-white border border-green-200 rounded-full
          px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
          transition-all
          ${isPending ? 'opacity-60' : ''}
        `}
      />
    </div>
  );
}
