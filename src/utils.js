export const dg = (s) => String(s || "").replace(/\D/g, "");

export const mCpf = (s) =>
  dg(s).slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const mDocumento = (s) => {
  const d = dg(s).slice(0, 14);
  if (d.length <= 11) return mCpf(d);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export const mTel = (s) => {
  const d = dg(s).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const mCep = (s) => {
  const d = dg(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const brl = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const mVal = (s) => {
  const d = dg(s);
  return d ? brl(parseInt(d, 10)) : "";
};

export const hoje = () => new Date().toLocaleDateString("sv-SE");

export const fdata = (s) => {
  const p = String(s).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
};
