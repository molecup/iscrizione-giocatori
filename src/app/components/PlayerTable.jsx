"use client";
import { useState } from "react";
import EditableCell from "./EditableCell";
import styles from "./PlayerTable.module.css";

const TAGLIE = ["S", "M", "L", "XL"];
const POSIZIONI = ["POR", "DIF", "CEN", "ATT"];

export default function PlayerTable({ players, setPlayers, onRequestRemoval, hidePayment=false }) {
  const [sortKey, setSortKey] = useState("cognome");
  const [sortAsc, setSortAsc] = useState(true);

  const updateField = (id, field, value) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const sorted = [...players].sort((a,b)=>{
    const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? "";
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const headerClick = (key) => {
    if (sortKey === key) setSortAsc(v => !v); else { setSortKey(key); setSortAsc(true);} 
  };

  return (
    <div className={styles.wrapper + " card"}>
      <table className="table">
        <thead>
          <tr>
            <th onClick={()=>headerClick('nome')} className={styles.sortable}>Nome</th>
            <th onClick={()=>headerClick('cognome')} className={styles.sortable}>Cognome</th>
            <th>Email</th>
            <th>Data di nascita</th>
            <th>Numero</th>
            <th>Taglia</th>
            <th>Posizione</th>
            {!hidePayment && <th>Quota pagata</th>}
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id}>
              <td>
                <span>{p.nome}</span>
              </td>
              <td>
                <span>{p.cognome}</span>
              </td>
              <td>
                <span>{p.email}</span>
              </td>
              <td>
                <span>{p.nascita}</span>
              </td>
              <td>
                <EditableCell value={p.numero} onChange={(v)=>updateField(p.id,'numero',Number(v))} type="number" min={1} max={99} />
              </td>
              <td>
                <EditableCell value={p.taglia} onChange={(v)=>updateField(p.id,'taglia',v)} type="select" options={TAGLIE} placeholder="Taglia" />
              </td>
              <td>
                <EditableCell value={p.posizione} onChange={(v)=>updateField(p.id,'posizione',v)} type="select" options={POSIZIONI} placeholder="Posizione" />
              </td>
              {!hidePayment && <td style={{textAlign:'center'}}>
                <input type="checkbox" checked={!!p.pagato} disabled aria-label="Quota pagata" />
              </td>}
              <td>
                <button className="button secondary" onClick={()=>onRequestRemoval?.(p)}>Richiedi rimozione</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
