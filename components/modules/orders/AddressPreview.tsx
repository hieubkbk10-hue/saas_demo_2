'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/app/admin/components/ui';

interface AddressPreviewProps {
  format: string;
}

interface ComboOption {
  code: string;
  name: string;
}

interface DistrictOption extends ComboOption {
  parentCode: string;
}

interface WardOption extends ComboOption {
  parentCode: string;
}

interface ComboboxProps {
  placeholder: string;
  options: ComboOption[];
  value: ComboOption | null;
  onChange: (value: ComboOption) => void;
}

function Combobox({ placeholder, options, value, onChange }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
      >
        <span className="truncate">{value ? value.name : placeholder}</span>
        <span className="text-xs text-slate-400">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm..."
            className="mb-2"
          />
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-xs text-slate-500">Không có kết quả.</div>
            )}
            {filtered.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <span>{option.name}</span>
                {value?.code === option.code && <span className="text-xs text-slate-400">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddressPreview({ format }: AddressPreviewProps) {
  const [provinces, setProvinces] = useState<ComboOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [districtCode, setDistrictCode] = useState<string | null>(null);
  const [wardCode, setWardCode] = useState<string | null>(null);

  useEffect(() => {
    if (format === 'text') {
      return;
    }
    let active = true;
    const loadData = async () => {
      const [provincesRes, districtsRes, wardsRes] = await Promise.all([
        fetch('/data/address-provinces.json'),
        fetch('/data/address-districts.json'),
        fetch('/data/address-wards.json'),
      ]);
      const provincesRaw = await provincesRes.json() as { id: string; name: string }[];
      const districtsRaw = await districtsRes.json() as Record<string, { code: string; name: string; name_with_type?: string; parent_code: string }>;
      const wardsRaw = await wardsRes.json() as Record<string, { code: string; name: string; name_with_type?: string; parent_code: string }>;

      if (!active) return;

      setProvinces(
        provincesRaw.map((province) => ({
          code: province.id.padStart(2, '0'),
          name: province.name,
        }))
      );
      setDistricts(
        Object.values(districtsRaw).map((district) => ({
          code: district.code,
          name: district.name_with_type ?? district.name,
          parentCode: district.parent_code,
        }))
      );
      setWards(
        Object.values(wardsRaw).map((ward) => ({
          code: ward.code,
          name: ward.name_with_type ?? ward.name,
          parentCode: ward.parent_code,
        }))
      );
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [format]);

  const districtsByProvince = useMemo(() => {
    const map = new Map<string, ComboOption[]>();
    districts.forEach((district) => {
      const list = map.get(district.parentCode) ?? [];
      list.push({ code: district.code, name: district.name });
      map.set(district.parentCode, list);
    });
    return map;
  }, [districts]);

  const districtToProvince = useMemo(() => {
    return new Map(districts.map((district) => [district.code, district.parentCode]));
  }, [districts]);

  const wardsByDistrict = useMemo(() => {
    const map = new Map<string, ComboOption[]>();
    wards.forEach((ward) => {
      const list = map.get(ward.parentCode) ?? [];
      list.push({ code: ward.code, name: ward.name });
      map.set(ward.parentCode, list);
    });
    return map;
  }, [wards]);

  const wardsByProvince = useMemo(() => {
    const map = new Map<string, ComboOption[]>();
    wards.forEach((ward) => {
      const province = districtToProvince.get(ward.parentCode);
      if (!province) return;
      const list = map.get(province) ?? [];
      list.push({ code: ward.code, name: ward.name });
      map.set(province, list);
    });
    return map;
  }, [districtToProvince, wards]);

  const resolvedProvince = provinces.find((province) => province.code === provinceCode) ?? provinces[0] ?? null;
  const activeProvinceCode = resolvedProvince?.code ?? null;
  const availableDistricts = activeProvinceCode ? (districtsByProvince.get(activeProvinceCode) ?? []) : [];
  const resolvedDistrict = availableDistricts.find((district) => district.code === districtCode) ?? availableDistricts[0] ?? null;
  const activeDistrictCode = resolvedDistrict?.code ?? null;
  const availableWards = format === '3-level'
    ? (activeDistrictCode ? (wardsByDistrict.get(activeDistrictCode) ?? []) : [])
    : (activeProvinceCode ? (wardsByProvince.get(activeProvinceCode) ?? []) : []);
  const resolvedWard = availableWards.find((ward) => ward.code === wardCode) ?? availableWards[0] ?? null;

  const selectedProvince = resolvedProvince;
  const selectedDistrict = resolvedDistrict;
  const selectedWard = resolvedWard;

  if (format === 'text') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-slate-500">Khách hàng sẽ nhập một dòng địa chỉ.</div>
        <Input placeholder="Địa chỉ giao hàng" disabled />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <Combobox
          placeholder="Chọn Tỉnh/Thành"
          options={provinces}
          value={selectedProvince}
          onChange={(option) => {
            setProvinceCode(option.code);
            setDistrictCode(null);
            setWardCode(null);
          }}
        />
        {format === '3-level' && (
          <Combobox
            placeholder="Chọn Quận/Huyện"
            options={availableDistricts}
            value={selectedDistrict}
            onChange={(option) => {
              setDistrictCode(option.code);
              setWardCode(null);
            }}
          />
        )}
        <Combobox
          placeholder="Chọn Phường/Xã"
          options={availableWards}
          value={selectedWard}
          onChange={(option) => setWardCode(option.code)}
        />
      </div>
      <Input placeholder="Số nhà, tên đường" />
    </div>
  );
}
