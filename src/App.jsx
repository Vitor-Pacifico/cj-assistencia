import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { brl, dg, fdata, hoje, mCep, mDocumento, mTel, mVal } from "./utils";

const SERVICOS = [
  "Troca de motor",
  "Recarga de gás",
  "Manutenção parte elétrica",
  "Troca de peça",
  "Higienização",
  "Venda de aparelho",
  "Outros",
];
const pedeDetalhe = (s) => s === "Troca de peça" || s === "Outros";

const APARELHOS = [
  "Máquina de lavar",
  "Máquina lava e seca",
  "Geladeira",
  "Bebedouro",
  "Micro-ondas",
  "Outros",
];

const vazio = () => ({
  nome: "", cpf: "", tel: "", cep: "", rua: "", bairro: "", num: "",
  ap: "Máquina de lavar", apDetalhe: "", dt: hoje(), servico: "", detalhe: "", vl: "",
});

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setBusy(true);
    setErro("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch {
      setErro("E-mail ou senha incorretos.");
    }
    setBusy(false);
  }

  return (
    <div className="wrap">
      <h1>CJ Assistência</h1>
      <p className="sub">Entre para ver e registrar os serviços.</p>
      <form className="card" onSubmit={entrar}>
        <label htmlFor="em">E-mail</label>
        <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="se" style={{ marginTop: 12 }}>Senha</label>
        <input id="se" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <div className="err" role="alert">{erro}</div>
        <div className="row"><button className="btn" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button></div>
      </form>
    </div>
  );
}

function Painel({ user }) {
  const [itens, setItens] = useState([]);
  const [f, setF] = useState(vazio());
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [erro, setErro] = useState("");
  const [q, setQ] = useState("");
  const [mes, setMes] = useState(hoje().slice(0, 7));

  const col = useMemo(() => collection(db, "users", user.uid, "servicos"), [user.uid]);

  useEffect(
    () =>
      onSnapshot(
        col,
        (s) => setItens(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => setErro("Não foi possível carregar os serviços. Verifique a internet e as regras do Firestore.")
      ),
    [col]
  );

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function onCep(e) {
    const v = mCep(e.target.value);
    setF((p) => ({ ...p, cep: v }));
    if (dg(v).length === 8) {
      fetch(`https://viacep.com.br/ws/${dg(v)}/json/`)
        .then((r) => r.json())
        .then((j) => {
          if (j && !j.erro)
            setF((p) => ({ ...p, rua: p.rua || j.logradouro || "", bairro: p.bairro || j.bairro || "" }));
        })
        .catch(() => {});
    }
  }

  function limpar() {
    setEditId(null);
    setF(vazio());
    setErro("");
  }

  async function salvar(e) {
    e.preventDefault();
    const vl = parseInt(dg(f.vl) || "0", 10);
    if (!f.nome.trim()) return setErro("Preencha o nome do cliente.");
    if (!f.dt) return setErro("Escolha a data do serviço.");
    if (f.ap === "Outros" && !f.apDetalhe.trim()) return setErro("Informe qual é o aparelho.");
    if (!f.servico) return setErro("Escolha o tipo de serviço.");
    if (pedeDetalhe(f.servico) && !f.detalhe.trim())
      return setErro(f.servico === "Troca de peça" ? "Informe qual peça foi trocada." : "Descreva o serviço feito.");
    if (!vl) return setErro("Preencha o valor do serviço.");
    const dados = {
      ...f,
      nome: f.nome.trim(),
      rua: f.rua.trim(),
      num: f.num.trim(),
      bairro: f.bairro.trim(),
      apDetalhe: f.ap === "Outros" ? f.apDetalhe.trim() : "",
      detalhe: pedeDetalhe(f.servico) ? f.detalhe.trim() : "",
      vl,
    };
    try {
      if (editId) await updateDoc(doc(db, "users", user.uid, "servicos", editId), dados);
      else await addDoc(col, { ...dados, criadoEm: Date.now() });
      if (dados.dt.slice(0, 7) !== mes && mes) setMes(dados.dt.slice(0, 7));
      limpar();
    } catch {
      setErro("Não foi possível salvar. Tente de novo.");
    }
  }

  function editar(x) {
    setEditId(x.id);
    setF({ ...vazio(), ...x, vl: brl(x.vl) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(id) {
    if (delId !== id) return setDelId(id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "servicos", id));
      if (editId === id) limpar();
    } catch {
      setErro("Não foi possível excluir.");
    }
    setDelId(null);
  }

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const td = dg(t);
    return itens
      .filter((x) => {
        if (mes && x.dt.slice(0, 7) !== mes) return false;
        if (!t) return true;
        return (
          `${x.nome} ${x.rua || ""} ${x.bairro || ""} ${x.ap || ""} ${x.apDetalhe || ""} ${x.servico || ""} ${x.detalhe || ""}`.toLowerCase().includes(t) ||
          (td && (dg(x.cpf).includes(td) || dg(x.tel).includes(td)))
        );
      })
      .sort((a, b) => (a.dt < b.dt ? 1 : a.dt > b.dt ? -1 : (b.criadoEm || 0) - (a.criadoEm || 0)));
  }, [itens, q, mes]);

  const total = lista.reduce((s, x) => s + x.vl, 0);

  function exportar() {
    const [a, m] = mes ? mes.split("-") : [];
    const periodo = mes ? `${m}/${a}` : "todos os períodos";
    const moeda = (c) => brl(c).replace(/\u00a0/g, " ");
    const endereco = (x) => {
      if (!x.rua) return x.num ? `Número ${x.num}` : "";
      const r = [x.rua, x.num].filter(Boolean).join(", ");
      return /^(rua|av|avenida|alameda|travessa|estrada|rodovia|praça|praca)(\s|\.|$)/i.test(x.rua) ? r : `Rua ${r}`;
    };
    const blocos = lista.map((x) => {
      const ap = x.ap === "Outros" && x.apDetalhe ? x.apDetalhe : x.ap;
      const serv = [x.servico, x.detalhe && `(${x.detalhe})`].filter(Boolean).join(" ");
      return [
        `Nome ${x.nome}`,
        x.cpf && `${dg(x.cpf).length > 11 ? "CNPJ" : "CPF"} ${x.cpf}`,
        x.cep && `CEP ${x.cep}`,
        endereco(x),
        x.bairro && `Bairro ${x.bairro}`,
        `Serviço: ${[serv, ap].filter(Boolean).join(" - ")}`,
        `Data ${fdata(x.dt)}`,
        moeda(x.vl),
      ].filter(Boolean).join("\n");
    });
    const texto = [
      `CJ Assistência - Serviços (${periodo})`,
      ...blocos,
      `Total: ${moeda(total)} (${lista.length} ${lista.length === 1 ? "serviço" : "serviços"})`,
    ].join("\n\n");
    const blob = new Blob([texto + "\n"], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `servicos-${mes || "todos"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="wrap">
      <div className="head">
        <div>
          <h1>CJ Assistência</h1>
          <p className="sub">Registro de serviços: máquina de lavar e geladeira</p>
        </div>
        <button className="btn sec sm" onClick={() => signOut(auth)}>Sair</button>
      </div>

      <form className="card" onSubmit={salvar} autoComplete="off" noValidate>
        <h2>{editId ? "Editar serviço" : "Novo serviço"}</h2>
        <div className="g">
          <div className="full"><label htmlFor="nome">Nome do cliente *</label><input id="nome" value={f.nome} onChange={set("nome")} /></div>
          <div><label htmlFor="cpf">CPF ou CNPJ</label><input id="cpf" inputMode="numeric" placeholder="000.000.000-00 / 00.000.000/0000-00" value={f.cpf} onChange={(e) => setF((p) => ({ ...p, cpf: mDocumento(e.target.value) }))} /></div>
          <div><label htmlFor="tel">Telefone (WhatsApp)</label><input id="tel" inputMode="tel" placeholder="(15) 90000-0000" value={f.tel} onChange={(e) => setF((p) => ({ ...p, tel: mTel(e.target.value) }))} /></div>
          <div className="full"><label htmlFor="cep">CEP</label><input id="cep" inputMode="numeric" placeholder="00000-000" value={f.cep} onChange={onCep} /></div>
          
          <div className="full"><label htmlFor="rua">Rua</label><input id="rua" value={f.rua} onChange={set("rua")} /></div>
          <div className="full"><label htmlFor="bairro">Bairro</label><input id="bairro" value={f.bairro} onChange={set("bairro")} /></div>
          <div className="full"><label htmlFor="num">Número da residência</label><input id="num" inputMode="numeric" value={f.num} onChange={set("num")} /></div>
          <div><label htmlFor="ap">Aparelho *</label>
            <select id="ap" value={f.ap} onChange={set("ap")}>{APARELHOS.map((a) => <option key={a}>{a}</option>)}</select></div>
          <div><label htmlFor="dt">Data do serviço *</label><input id="dt" type="date" value={f.dt} onChange={set("dt")} /></div>
          {f.ap === "Outros" && (
            <div className="full"><label htmlFor="apd">Qual aparelho? *</label>
              <input id="apd" value={f.apDetalhe} onChange={set("apDetalhe")} placeholder="Ex.: cervejeira" /></div>
          )}
          <div className="full"><label htmlFor="sv">Tipo de serviço *</label>
            <select id="sv" value={f.servico} onChange={set("servico")}>
              <option value="">Selecione…</option>
              {SERVICOS.map((s) => <option key={s}>{s}</option>)}
            </select></div>
          {pedeDetalhe(f.servico) && (
            <div className="full"><label htmlFor="det">{f.servico === "Troca de peça" ? "Qual peça? *" : "Descreva o serviço *"}</label>
              <input id="det" value={f.detalhe} onChange={set("detalhe")} placeholder={f.servico === "Troca de peça" ? "Ex.: bomba de drenagem" : "O que foi feito"} /></div>
          )}
          <div className="full"><label htmlFor="vl">Valor *</label><input id="vl" inputMode="numeric" placeholder="R$ 0,00" value={f.vl} onChange={(e) => setF((p) => ({ ...p, vl: mVal(e.target.value) }))} /></div>
        </div>
        <div className="err" role="alert">{erro}</div>
        <div className="row">
          <button className="btn" type="submit">{editId ? "Salvar alterações" : "Salvar serviço"}</button>
          {editId && <button className="btn sec" type="button" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <section className="card">
        <div className="tot"><span className="sub" style={{ margin: 0 }}>{lista.length} {lista.length === 1 ? "serviço" : "serviços"}</span><b>{brl(total)}</b></div>
        <p className="sub" style={{ margin: "2px 0 12px" }}>Total do período selecionado</p>
        <div className="bar">
          <input type="search" placeholder="Buscar por nome, CPF/CNPJ, rua ou telefone" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <input type="month" aria-label="Mês" value={mes} onChange={(e) => setMes(e.target.value)} />
          <button className="btn sec" type="button" onClick={() => setMes("")}>Ver todos os meses</button>
          <button className="btn sec" type="button" onClick={exportar} disabled={!lista.length}>Baixar relatório (TXT)</button>
        </div>

        {!lista.length && <div className="empty">{itens.length ? "Nenhum serviço encontrado neste filtro." : "Nenhum serviço registrado ainda."}</div>}
        {lista.map((x) => {
          const end = [[x.rua, x.num].filter(Boolean).join(", "), x.bairro, x.cep && `CEP ${x.cep}`].filter(Boolean).join(" · ");
          const contato = [x.cpf && `${dg(x.cpf).length > 11 ? "CNPJ" : "CPF"} ${x.cpf}`, x.tel].filter(Boolean).join(" · ");
          return (
            <div className="it" key={x.id}>
              <div className="top">
                <div><div className="nm">{x.nome}</div><span className="tag">{x.ap === "Outros" && x.apDetalhe ? x.apDetalhe : x.ap}</span> <span className="meta">{fdata(x.dt)}</span></div>
                <div className="vl">{brl(x.vl)}</div>
              </div>
              {x.servico && <div className="svc">{x.servico}{x.detalhe ? `: ${x.detalhe}` : ""}</div>}
              {end && <div className="meta">{end}</div>}
              {contato && <div className="meta">{contato}</div>}
              <div className="row" style={{ marginTop: 10 }}>
                {dg(x.tel).length >= 10 && <a className="btn wa sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/55${dg(x.tel)}`}>WhatsApp</a>}
                <button className="btn sec sm" onClick={() => editar(x)}>Editar</button>
                {delId === x.id ? (
                  <>
                    <button className="btn dg sm" onClick={() => excluir(x.id)}>Confirmar exclusão</button>
                    <button className="btn sec sm" onClick={() => setDelId(null)}>Não</button>
                  </>
                ) : (
                  <button className="btn sec sm" onClick={() => excluir(x.id)}>Excluir</button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <div className="empty">Carregando…</div>;
  return user ? <Painel user={user} /> : <Login />;
}
