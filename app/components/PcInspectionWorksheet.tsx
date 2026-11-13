'use client';

import { useEffect, useRef, useState } from 'react';
import './pc-inspection-worksheet.css';

type Device = {
  id: number;
  name: string;
  checkedOn: string;
  cpu: string;
  ram: string;
  storage: string;
  windows: string;
  activation: string;
  unconfirmed: string;
};

type DeviceField = keyof Omit<Device, 'id'>;
type RemovedDevice = { device: Device; index: number };

const emptyDevice = (id: number): Device => ({
  id, name: '', checkedOn: '', cpu: '', ram: '', storage: '', windows: '',
  activation: '미확인', unconfirmed: '',
});

const fieldDefinitions: { field: DeviceField; label: string; placeholder: string }[] = [
  { field: 'cpu', label: 'CPU 모델', placeholder: '미확인' },
  { field: 'ram', label: 'RAM 용량', placeholder: '미확인 · 확인한 용량과 단위' },
  { field: 'storage', label: '저장장치 종류·용량', placeholder: '미확인' },
  { field: 'windows', label: 'Windows 에디션·버전', placeholder: '미확인' },
];

export function PcInspectionWorksheet() {
  const [devices, setDevices] = useState<Device[]>(() => [emptyDevice(1)]);
  const [removed, setRemoved] = useState<RemovedDevice[]>([]);
  const [message, setMessage] = useState('');
  const [focusDeviceId, setFocusDeviceId] = useState<number | null>(null);
  const nextId = useRef(2);
  const addButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusDeviceId !== null) document.getElementById(`inspection-${focusDeviceId}-name`)?.focus();
  }, [focusDeviceId]);

  useEffect(() => {
    const finishPrint = () => { delete document.documentElement.dataset.printSection; };
    window.addEventListener('afterprint', finishPrint);
    return () => { window.removeEventListener('afterprint', finishPrint); finishPrint(); };
  }, []);

  function updateDevice(id: number, field: DeviceField, value: string) {
    setDevices(previous => previous.map(device => device.id === id ? { ...device, [field]: value } : device));
  }

  function addDevice() {
    const id = nextId.current++;
    setDevices(previous => [...previous, emptyDevice(id)]);
    setFocusDeviceId(id);
    setMessage('빈 기기 점검 카드를 추가했습니다.');
  }

  function removeDevice(id: number) {
    if (devices.length <= 1) return;
    const index = devices.findIndex(device => device.id === id);
    const device = devices[index];
    if (!device) return;
    setRemoved(previous => [...previous, { device, index }]);
    setDevices(previous => previous.filter(item => item.id !== id));
    setFocusDeviceId(null);
    setMessage(`${device.name.trim() || `기기 ${index + 1}`} 카드를 삭제했습니다. 삭제 취소로 입력 내용을 복원할 수 있습니다.`);
    addButton.current?.focus();
  }

  function undoRemoval() {
    const last = removed[removed.length - 1];
    if (!last) return;
    setDevices(previous => {
      const restored = [...previous];
      restored.splice(Math.min(last.index, restored.length), 0, last.device);
      return restored;
    });
    setRemoved(previous => previous.slice(0, -1));
    setFocusDeviceId(last.device.id);
    setMessage('삭제한 기기 카드와 입력 내용을 복원했습니다.');
  }

  function printWorksheet() {
    document.documentElement.dataset.printSection = 'pc-inspection';
    try {
      window.print();
    } catch {
      delete document.documentElement.dataset.printSection;
      setMessage('인쇄 창을 열지 못했습니다. 브라우저의 인쇄 기능을 이용해 주세요.');
    }
  }

  return <section id="pc-inspection-worksheet" className="pc-inspection-worksheet information-section" aria-labelledby="pc-inspection-title">
    <div className="inspection-heading">
      <span className="guide-kicker">피씨이음 · 직접 작성하는 점검표</span>
      <h2 id="pc-inspection-title">기기별 PC 인수 점검표</h2>
      <p>앞에서 확인한 사양과 상태를 기기별로 기록하세요. 확인하지 못한 항목은 미확인으로 두고, 남은 질문을 함께 적을 수 있습니다.</p>
    </div>
    <p id="inspection-storage-note" className="inspection-storage-note inspection-screen-only">입력 내용은 이 페이지에서만 유지되며 서버로 전송하거나 브라우저에 저장하지 않습니다. 새로고침하기 전에 점검표를 인쇄해 보관하세요.</p>
    <div className="inspection-actions inspection-screen-only">
      <button type="button" className="btn btn-secondary" ref={addButton} onClick={addDevice}>기기 추가</button>
      <button type="button" className="btn btn-primary" onClick={printWorksheet}>점검표 인쇄</button>
      {removed.length > 0 && <button type="button" className="btn btn-secondary" onClick={undoRemoval}>삭제 취소 ({removed.length})</button>}
      <span className="inspection-device-count">점검 기기 {devices.length}대</span>
    </div>
    <div className="inspection-status inspection-screen-only" role="status" aria-live="polite">{message}</div>
    <div className="inspection-devices">
      {devices.map((device, index) => <section className="inspection-device" key={device.id} aria-labelledby={`inspection-${device.id}-title`}>
        <div className="inspection-device-heading">
          <h3 id={`inspection-${device.id}-title`}>기기 {index + 1}</h3>
          <button type="button" className="inspection-remove inspection-screen-only" onClick={() => removeDevice(device.id)} disabled={devices.length === 1} aria-label={`기기 ${index + 1} 카드 삭제`}>기기 삭제</button>
        </div>
        <fieldset className="inspection-fields inspection-screen-only" aria-describedby="inspection-storage-note">
          <legend className="sr-only">기기 {index + 1} 점검 항목</legend>
          <label htmlFor={`inspection-${device.id}-name`}>기기 번호·이름<input id={`inspection-${device.id}-name`} value={device.name} onChange={event => updateDevice(device.id, 'name', event.target.value)} placeholder="직접 정한 식별명" maxLength={80} autoComplete="off" /></label>
          <label htmlFor={`inspection-${device.id}-checkedOn`}>확인 날짜<input id={`inspection-${device.id}-checkedOn`} type="date" value={device.checkedOn} onChange={event => updateDevice(device.id, 'checkedOn', event.target.value)} /></label>
          {fieldDefinitions.map(({ field, label, placeholder }) => <label htmlFor={`inspection-${device.id}-${field}`} key={field}>{label}<input id={`inspection-${device.id}-${field}`} value={device[field]} onChange={event => updateDevice(device.id, field, event.target.value)} placeholder={placeholder} maxLength={160} autoComplete="off" /></label>)}
          <label htmlFor={`inspection-${device.id}-activation`} className="inspection-full-width">Windows 인증 화면<select id={`inspection-${device.id}-activation`} value={device.activation} onChange={event => updateDevice(device.id, 'activation', event.target.value)}>
            <option>미확인</option><option>화면에서 인증됨 확인</option><option>화면에서 인증되지 않음 확인</option><option>확인할 수 없음</option>
          </select></label>
          <label htmlFor={`inspection-${device.id}-unconfirmed`} className="inspection-full-width">미확인 항목·추가 질문<textarea id={`inspection-${device.id}-unconfirmed`} value={device.unconfirmed} onChange={event => updateDevice(device.id, 'unconfirmed', event.target.value)} rows={2} placeholder="설명과 다른 점, 확인할 자료와 남은 질문" maxLength={1000} /></label>
        </fieldset>
        <dl className="inspection-print-values">
          {([
            ['기기 번호·이름', device.name], ['확인 날짜', device.checkedOn],
            ...fieldDefinitions.map(({ field, label }) => [label, device[field]]),
            ['Windows 인증 화면', device.activation], ['미확인 항목·추가 질문', device.unconfirmed],
          ]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.trim() || '미확인'}</dd></div>)}
        </dl>
      </section>)}
    </div>
    <p className="inspection-footnote">빈칸은 인쇄할 때 미확인으로 표시됩니다. 인증 화면과 소프트웨어 취득·인계 자료는 위 정보글의 확인 방법에 따라 각각 살펴보세요.</p>
    <p className="inspection-print-origin">확인 방법: 피씨이음 · pcieum.com/guides/adult-pc-used-computer-check</p>
  </section>;
}
