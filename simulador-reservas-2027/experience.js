"use strict";
(() => {
  const API="https://iwnritxkxbiomxsnubbv.supabase.co/functions/v1/lagoa-experience-api";
  const STORAGE_KEY="lagoa_experience_session_v1";
  const $=id=>document.getElementById(id);
  let token=sessionStorage.getItem(STORAGE_KEY)||"";
  let currentUser=null,adminRows=[],adminActivity=[],knownOperators=[],sessionQuotes=0,toastTimer=null;
  let simulateTimer=null,lastSimSignature='',reportTruncated=false;
  let tariffRows=[],tariffLastJson='',tariffSnapshot=null,tariffDirty=false,tariffSyncAt=0;
  const fmtMoney=c=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((Number(c)||0)/100);
  const fmtDate=d=>d?String(d).split("-").reverse().join("/"):"—";
  const today=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const daysAgo=n=>{const d=new Date(today()+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);};
  const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function toast(message,error=false){
    const e=$("expToast");e.textContent=message;e.classList.toggle("error",error);e.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.hidden=true,5200);
  }
  async function request(action,data={},authToken=token){
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),25000);
    try{
      const response=await fetch(API,{method:"POST",mode:"cors",cache:"no-store",
        headers:{"Content-Type":"application/json",...(authToken?{"Authorization":"Bearer "+authToken}:{})},
        body:JSON.stringify({action,...data}),signal:ac.signal});
      const result=await response.json().catch(()=>({error:"Resposta inválida do servidor."}));
      if(!response.ok||result.ok===false)throw new Error(result.error||"Falha ao acessar o sistema.");
      return result;
    }catch(err){
      if(err.name==="AbortError")throw new Error("O servidor não respondeu. Tente novamente.");
      if(err instanceof TypeError)throw new Error("Falha de conexão com o servidor. Verifique a internet.");
      throw err;
    }finally{clearTimeout(timer);}
  }
  function showAuth(){
    currentUser=null;document.body.classList.add("auth-pending");document.body.classList.remove("exp-admin-mode");
    $("experienceAuth").hidden=false;$("experienceAdmin").hidden=true;$("experienceToolbar").hidden=true;
    $("expPassword").value="";$("expPassword").type="password";
    $("expTogglePassword").textContent="Mostrar";$("expTogglePassword").setAttribute("aria-pressed","false");
    $("expTogglePassword").setAttribute("aria-label","Mostrar senha");$("expAuthError").hidden=true;
  }
  function showOperator(user){
    document.body.classList.remove("auth-pending","exp-admin-mode");
    $("experienceAuth").hidden=true;$("experienceAdmin").hidden=true;$("experienceToolbar").hidden=false;
    $("expCurrentOperator").textContent=user.display_name;
    $("expSessionCount").textContent="Orçamentos nesta sessão: "+sessionQuotes;
  }
  function showAdmin(user){
    document.body.classList.remove("auth-pending");document.body.classList.add("exp-admin-mode");
    $("experienceAuth").hidden=true;$("experienceToolbar").hidden=true;$("experienceAdmin").hidden=false;
    $("expAdminWelcome").textContent="Acesso gerencial · "+user.display_name;
    $("expDateStart").value=today();$("expDateEnd").value=today();
    setAdminTab("reports");refreshAdmin();
  }
  async function loadPeople(){
    const result=await request("operators",{},"");
    knownOperators=result.operators||[];
    const select=$("expOperatorSelect");
    select.innerHTML='<option value="">Selecione seu usuário</option>'+
      '<optgroup label="Operadores">'+knownOperators.filter(u=>!u.is_admin).map(u=>
      '<option value="'+escapeHtml(u.id)+'">'+escapeHtml(u.display_name)+'</option>').join("")+'</optgroup>'+
      '<optgroup label="Gestão">'+knownOperators.filter(u=>u.is_admin).map(u=>
      '<option value="'+escapeHtml(u.id)+'">Administrador</option>').join("")+'</optgroup>';
    const adminSelect=$("expAdminOperator");
    adminSelect.innerHTML='<option value="">Todos os operadores</option>'+
      knownOperators.filter(u=>!u.is_admin).map(u=>
      '<option value="'+escapeHtml(u.id)+'">'+escapeHtml(u.display_name)+'</option>').join("");
  }
  async function login(event){
    event.preventDefault();
    const id=$("expOperatorSelect").value,password=$("expPassword").value;
    if(!id||!password){$("expAuthError").textContent="Selecione o operador e informe a senha.";$("expAuthError").hidden=false;return;}
    $("expAuthError").hidden=true;
    $("expLoginBtn").disabled=true;$("expLoginBtn").textContent="Validando acesso...";
    try{
      const result=await request("login",{user_id:id,password},"");
      token=result.token;currentUser=result.user;sessionStorage.setItem(STORAGE_KEY,token);
      sessionQuotes=0;lastSimSignature="";clearTimeout(simulateTimer);
      $("expLoginBtn").textContent="Carregando tarifários...";
      try{
        await syncTariffs();
      }catch(error){
        // Credenciais aceitas. Uma falha da base de tarifas não é senha incorreta.
        token="";currentUser=null;sessionStorage.removeItem(STORAGE_KEY);
        $("expAuthError").textContent="Senha validada, mas não foi possível carregar os tarifários: "+error.message+". Confira a conexão e tente novamente.";
        $("expAuthError").hidden=false;
        return;
      }
      // Ao trocar de colaborador, uma cotação anterior não pertence ao novo usuário.
      if(!currentUser.is_admin){
        try{$("resetBtn")?.click();}catch(error){console.warn("Falha ao limpar a cotação anterior.");}
      }
      if(currentUser.is_admin)showAdmin(currentUser);else showOperator(currentUser);
      if(currentUser.must_change_password)toast("Senha padrão em uso. Recomenda-se alterá-la no menu Alterar senha.");
    }catch(err){$("expAuthError").textContent=err.message;$("expAuthError").hidden=false;}
    finally{$("expLoginBtn").disabled=false;$("expLoginBtn").textContent="Entrar na plataforma";}
  }
  async function logout(){
    const old=token;token="";currentUser=null;lastSimSignature="";clearTimeout(simulateTimer);sessionStorage.removeItem(STORAGE_KEY);
    const reset=$("resetBtn");
    if(reset&&typeof reset.click==="function")reset.click();
    showAuth();
    if(old)try{await request("logout",{},old);}catch(_){}
  }
  function quoteData(q){
    return {
      hotel:q.hotel,year:q.year,meal:q.meal,map_choice:q.mapChoice||"",
      checkin:q.start,checkout:q.end,adults:q.adults,children:q.children,
      children_ages:q.orderedChildAges||[],nights:q.days.length,discount_pct:q.discount,
      total_cents:q.total,discount_cents:q.discountCents,net_cents:q.net,
      ceia_cents:q.ceiaTotal,grand_total_cents:q.netWithCeia
    };
  }
  async function record(action,quoteOverride=null,silent=false){
    if(!currentUser||currentUser.is_admin)return;
    const quote=quoteOverride||(typeof state!=="undefined"&&state.quote)||null;
    if(!quote){if(action==="simulate"&&!silent)toast("Preencha a simulação para registrar um orçamento.",true);return;}
    try{
      const reply=await request("record",{event_type:action,quote:quoteData(quote)});
      if(reply.created){sessionQuotes++;$("expSessionCount").textContent="Orçamentos nesta sessão: "+sessionQuotes;}
      if(!silent)toast(reply.created?"Novo orçamento contabilizado.":"Ação registrada, sem duplicar o orçamento.");
    }catch(err){toast("O registro de produtividade não foi salvo: "+err.message,true);}
  }
  function quoteFingerprint(quote){
    return JSON.stringify(quoteData(quote));
  }
  function queueSimulation(quote){
    clearTimeout(simulateTimer);
    if(!currentUser||currentUser.is_admin||!quote)return;
    const signature=quoteFingerprint(quote);
    if(signature===lastSimSignature)return;
    simulateTimer=setTimeout(()=>{
      if(!currentUser||currentUser.is_admin||
         !state.quote||quoteFingerprint(state.quote)!==signature)return;
      lastSimSignature=signature;
      record("simulate",quote,true);
    },1400);
  }
  function completedAction(type,quote){
    if(!currentUser||currentUser.is_admin||!quote)return;
    // A cópia ou PDF já prova que o orçamento foi gerado.
    clearTimeout(simulateTimer);
    lastSimSignature=quoteFingerprint(quote);
    record(type,quote,true);
  }
  function setKpi(id,value){$(id).textContent=value;}
  function rowData(r){
    return {id:r.id,date:r.local_date,operator:r.operator_name||"—",operator_id:r.user_id,
      hotel:r.hotel==="eco"?"Eco Towers":"Jardins",period:fmtDate(r.checkin)+" a "+fmtDate(r.checkout),
      checkin:r.checkin,checkout:r.checkout,adults:r.adults,children:r.children,nights:r.nights,
      meal:r.meal==="CAFE"?"Café":r.meal==="MAP"?"Meia pensão":"Pensão completa",
      map_choice:r.map_choice,discount:Number(r.discount_pct)||0,full:r.total_cents,
      discountCents:r.discount_cents,ceia:r.ceia_cents,total:r.grand_total_cents,
      source:r.source_action,simulations:r.simulations||0,copies:r.copies||0,pdfs:r.pdfs||0};
  }
  function aggregate(rows,keyFn){
    const map=new Map();
    for(const record of rows){
      const key=keyFn(record);let data=map.get(key);
      if(!data){data={key,count:0,total:0,simulations:0,copies:0,pdfs:0};map.set(key,data);}
      data.count++;data.total+=Number(record.total)||0;
      data.simulations+=Number(record.simulations)||0;data.copies+=Number(record.copies)||0;data.pdfs+=Number(record.pdfs)||0;
    }
    return [...map.values()];
  }
  function activityGroups(records,keyFn){
    const out=new Map();
    for(const r of records){
      const key=keyFn(r);
      let entry=out.get(key);
      if(!entry){entry={key,simulations:0,copies:0,pdfs:0};out.set(key,entry);}
      entry.simulations+=r.simulations;entry.copies+=r.copies;entry.pdfs+=r.pdfs;
    }
    return [...out.values()];
  }
  function bars(target,records,labels,metric){
    const root=$(target);
    const filtered=records.filter(r=>r[metric]>0);
    if(!filtered.length){root.innerHTML='<p class="exp-muted">Nenhum registro desta atividade no período.</p>';return;}
    const highest=Math.max(1,...filtered.map(r=>r[metric]));
    root.innerHTML=filtered.map(r=>'<div class="exp-bar-row"><span title="'+escapeHtml(labels(r))+'">'+
      escapeHtml(labels(r).length>20?labels(r).slice(0,18)+"…":labels(r))+'</span><span class="exp-bar-track"><span class="exp-bar-fill" style="display:block;width:'+
      (Math.max(4,100*r[metric]/highest)).toFixed(1)+'%"></span></span><b>'+r[metric]+'</b></div>').join("");
  }
  function renderDashboard(rows,activity=[],truncated=false){
    adminRows=rows.map(rowData);
    adminActivity=activity.map(a=>({
      date:a.local_date,operator:a.operator_name||"Operador desconhecido",operator_id:a.user_id,
      simulations:Number(a.simulations)||0,copies:Number(a.copies)||0,pdfs:Number(a.pdfs)||0
    }));
    reportTruncated=!!truncated;
    const total=adminRows.reduce((sum,r)=>sum+(Number(r.total)||0),0);
    const sum=adminActivity.reduce((v,r)=>{
      v.simulations+=r.simulations;v.copies+=r.copies;v.pdfs+=r.pdfs;return v;
    },{simulations:0,copies:0,pdfs:0});
    setKpi("expKpiQuotes",adminRows.length.toLocaleString("pt-BR"));
    setKpi("expKpiValue",fmtMoney(total));
    setKpi("expKpiSimulations",sum.simulations.toLocaleString("pt-BR"));
    setKpi("expKpiCopies",sum.copies.toLocaleString("pt-BR"));
    setKpi("expKpiPdf",sum.pdfs.toLocaleString("pt-BR"));
    const perDay=activityGroups(adminActivity,r=>r.date).sort((a,b)=>a.key.localeCompare(b.key));
    const perPerson=activityGroups(adminActivity,r=>r.operator);
    bars("expChartDaily",perDay,r=>fmtDate(r.key),"simulations");
    bars("expChartCopiesDaily",perDay,r=>fmtDate(r.key),"copies");
    bars("expChartOperator",[...perPerson].sort((a,b)=>b.simulations-a.simulations||a.key.localeCompare(b.key)),
      r=>r.key,"simulations");
    bars("expChartCopiesOperator",[...perPerson].sort((a,b)=>b.copies-a.copies||a.key.localeCompare(b.key)),
      r=>r.key,"copies");
    $("expActivityRows").innerHTML=adminActivity.length?
      adminActivity.map(a=>'<tr><td>'+fmtDate(a.date)+'</td><td>'+escapeHtml(a.operator)+
       '</td><td class="num">'+a.simulations+'</td><td class="num">'+a.copies+
       '</td><td class="num">'+a.pdfs+'</td></tr>').join(""):
      '<tr><td colspan="5" class="exp-loading">Nenhuma simulação ou cópia registrada no período.</td></tr>';
    $("expRows").innerHTML=adminRows.length?adminRows.map(r=>'<tr><td>'+fmtDate(r.date)+'</td><td>'+
      escapeHtml(r.operator)+'</td><td>'+escapeHtml(r.hotel)+'</td><td>'+escapeHtml(r.period)+
      '</td><td class="num">'+r.adults+'</td><td class="num">'+r.children+'</td><td>'+escapeHtml(r.meal)+
      '</td><td class="num">'+fmtMoney(r.total)+'</td><td><span class="exp-tag">'+escapeHtml(r.source)+'</span></td>'+
      '<td class="num">'+r.simulations+'</td><td class="num">'+r.copies+'</td><td class="num">'+r.pdfs+'</td></tr>').join(""):
      '<tr><td colspan="12" class="exp-loading">Nenhum orçamento novo no período. Confira também o quadro de atividades.</td></tr>';
    $("expAdminStatus").textContent=adminRows.length+' orçamento(s) distinto(s) · '+
      sum.simulations+' simulação(ões) · '+sum.copies+' cópia(s) · horário de Brasília.';
    $("expDownloadExcel").disabled=reportTruncated||(!adminRows.length&&!adminActivity.length);
  }
  async function refreshAdmin(){
    if(!currentUser?.is_admin)return;
    const date_from=$("expDateStart").value,date_to=$("expDateEnd").value,user_id=$("expAdminOperator").value||null;
    if(!date_from||!date_to||date_to<date_from){toast("Informe um período válido.",true);return;}
    $("expApplyFilters").disabled=true;$("expAdminStatus").textContent="Consultando registros...";
    try{const result=await request("analytics",{date_from,date_to,user_id});renderDashboard(result.rows||[],result.activity||[],result.truncated);
      if(result.truncated)toast("Relatório incompleto: reduza o período. A exportação ficará desabilitada.",true);
    }catch(err){$("expAdminStatus").textContent="Erro ao carregar os relatórios.";toast(err.message,true);}
    finally{$("expApplyFilters").disabled=false;}
  }
  function xmlEscape(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
  function excelCol(i){let out="";for(i++;i;i=Math.floor((i-1)/26))out=String.fromCharCode(65+(i-1)%26)+out;return out;}
  function sheetXml(table,currencyColumns=[]){
    const records=table.map((line,row)=>'<row r="'+(row+1)+'">'+line.map((cell,col)=>{
      const ref=excelCol(col)+(row+1);
      if(typeof cell==="number"&&Number.isFinite(cell))
        return '<c r="'+ref+'"'+(currencyColumns.includes(col)&&row>0?' s="2"':'')+'><v>'+cell+'</v></c>';
      return '<c r="'+ref+'" t="inlineStr"'+(row===0?' s="1"':'')+'><is><t>'+
        xmlEscape(cell)+'</t></is></c>';
    }).join("")+'</row>').join("");
    const maxCols=Math.max(1,...table.map(r=>r.length));
    const widths='<cols>'+Array.from({length:maxCols},(_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(i===1?36:i===2?20:18)+'" customWidth="1"/>').join("")+'</cols>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
      widths+'<sheetData>'+records+'</sheetData><autoFilter ref="A1:'+excelCol(maxCols-1)+table.length+'"/></worksheet>';
  }
  const enc=new TextEncoder();
  const crcTable=(()=>{const arr=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;arr.push(c>>>0);}return arr;})();
  function crc32(bytes){let v=0xFFFFFFFF;for(const b of bytes)v=crcTable[(v^b)&255]^(v>>>8);return (v^0xFFFFFFFF)>>>0;}
  function writeZip(files){
    const out=[],central=[];let offset=0;
    const u16=(a,v)=>{a.push(v&255,(v>>>8)&255);},u32=(a,v)=>{a.push(v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255);};
    for(const [name,content] of files){
      const nameBytes=enc.encode(name),data=enc.encode(content),crc=crc32(data);
      const header=[];u32(header,0x04034b50);u16(header,20);u16(header,0);u16(header,0);u16(header,0);u16(header,0);
      u32(header,crc);u32(header,data.length);u32(header,data.length);u16(header,nameBytes.length);u16(header,0);
      out.push(...header,...nameBytes);
      for(let i=0;i<data.length;i++)out.push(data[i]);
      const cd=[];u32(cd,0x02014b50);u16(cd,20);u16(cd,20);u16(cd,0);u16(cd,0);u16(cd,0);u16(cd,0);
      u32(cd,crc);u32(cd,data.length);u32(cd,data.length);u16(cd,nameBytes.length);u16(cd,0);u16(cd,0);u16(cd,0);u16(cd,0);u32(cd,0);u32(cd,offset);
      central.push(...cd,...nameBytes);offset+=header.length+nameBytes.length+data.length;
    }
    const centralStart=out.length;out.push(...central);
    const end=[];u32(end,0x06054b50);u16(end,0);u16(end,0);u16(end,files.length);u16(end,files.length);u32(end,central.length);u32(end,centralStart);u16(end,0);
    out.push(...end);return new Uint8Array(out);
  }
  function exportXlsx(){
    if(reportTruncated){toast("Relatório incompleto. Reduza o período para exportar todos os dados.",true);return;}
    if(!adminRows.length&&!adminActivity.length){toast("Não há dados para exportar.",true);return;}
    const daily=[["Data da atividade","Operador","Simulações distintas","Cópias concluídas","PDFs gerados"],
      ...adminActivity.map(r=>[r.date,r.operator,r.simulations,r.copies,r.pdfs])];
    const byPerson=activityGroups(adminActivity,r=>r.operator).sort((a,b)=>b.simulations-a.simulations);
    const perPerson=[["Operador","Simulações distintas","Cópias concluídas","PDFs gerados"],
      ...byPerson.map(r=>[r.key,r.simulations,r.copies,r.pdfs])];
    const detail=[["Data do orçamento","Operador","Hotel","Check-in","Check-out","Noites","Adultos 13+","Crianças até 12",
      "Regime","Meia pensão","Desconto (%)","Particular (R$)","Desconto (R$)","Ceia (R$)","Conceito total (R$)","Origem","Cliques em Simular","Cópias no período","PDFs no período"],
      ...adminRows.map(r=>[r.date,r.operator,r.hotel,r.checkin,r.checkout,r.nights,r.adults,r.children,r.meal,r.map_choice,r.discount,
        Number(r.full)/100,Number(r.discountCents)/100,Number(r.ceia)/100,Number(r.total)/100,r.source,r.simulations,r.copies,r.pdfs])];
        const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
      [1,2,3].map(i=>'<Override PartName="/xl/worksheets/sheet'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+'</Types>';
    const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Resumo por dia" sheetId="1" r:id="rId1"/><sheet name="Por operador" sheetId="2" r:id="rId2"/><sheet name="Orçamentos" sheetId="3" r:id="rId3"/></sheets></workbook>';
    const wbRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      [1,2,3].map(i=>'<Relationship Id="rId'+i+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+i+'.xml"/>').join("")+
      '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF254672"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>';
    const files=[
      ["[Content_Types].xml",contentTypes],["_rels/.rels",rels],["xl/workbook.xml",workbook],["xl/_rels/workbook.xml.rels",wbRels],["xl/styles.xml",styles],
      ["xl/worksheets/sheet1.xml",sheetXml(daily)],["xl/worksheets/sheet2.xml",sheetXml(perPerson)],["xl/worksheets/sheet3.xml",sheetXml(detail,[11,12,13,14])]
    ];
    const blob=new Blob([writeZip(files)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="Lagoa_Experience_Produtividade_"+$("expDateStart").value+"_a_"+$("expDateEnd").value+".xlsx";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast("Excel gerado: simulações e cópias por dia, por operador e orçamentos detalhados.");
  }

  // Consulta a base compartilhada antes de liberar os preços do simulador.
  async function syncTariffs(silent=false){
    if(!token)throw new Error("Entre na plataforma para consultar os tarifários.");
    if(!window.lagoaTariffAPI)throw new Error("O motor de tarifários não está disponível.");
    const result=await request("tariffs");
    if(!Array.isArray(result.rows))throw new Error("O servidor não devolveu os preços publicados.");
    const fresh=JSON.stringify(result.rows);
    if(fresh!==tariffLastJson){
      tariffRows=result.rows;
      window.lagoaTariffAPI.applyPublishedTariffs(tariffRows);
      tariffLastJson=fresh;
      if(silent&&currentUser&&!currentUser.is_admin&&tariffSyncAt>0)
        toast("Os tarifários foram atualizados. Confira os valores recalculados antes de enviar o orçamento.");
    }
    tariffSyncAt=Date.now();
    return tariffRows;
  }
  function setAdminTab(tab){
    const isTariff=tab==="tariffs";
    if(!isTariff&&tariffDirty&&!confirm("Existem valores não salvos. Deseja sair sem salvar?"))return;
    $("expReportsPane").hidden=isTariff;
    $("expTariffsPane").hidden=!isTariff;
    $("expTabReports").classList.toggle("active",!isTariff);
    $("expTabTariffs").classList.toggle("active",isTariff);
    $("expTabReports").setAttribute("aria-selected",String(!isTariff));
    $("expTabTariffs").setAttribute("aria-selected",String(isTariff));
    if(isTariff){renderTariffEditor();refreshTariffHistory();}
    else tariffDirty=false;
  }
  const tariffLabels={CAFE:"Café da manhã",MAP:"Meia Pensão (MAP)",FAP:"Pensão Completa (FAP)",
    DBL:"SGL/DBL (até 2)",TPL:"TPL (3)",QDL:"QDL (4)",QTL:"QTL (5)",ADC:"ADC — Adicional",
    eco:"Eco Towers",jardins:"Jardins"};
  const tierNames=["BAIXA","MÉDIA","ALTA","SUPER ALTA"];
  const tariffFormat=c=>new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(c/100);
  function parseTariffPrice(value){
    let v=String(value??"").trim().replace(/\s/g,"");
    if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(v))v=v.replace(/\./g,"").replace(",",".");
    else if(/^\d+(?:[,\.]\d{1,2})?$/.test(v))v=v.replace(",",".");
    else throw new Error("Formato inválido. Exemplo: 501,75.");
    const [reais,centavos=""]=v.split(".");
    const cents=Number(reais)*100+Number(centavos.padEnd(2,"0"));
    if(!Number.isSafeInteger(cents)||cents<=0||cents>100000000)
      throw new Error("O valor precisa ser maior que zero e respeitar o limite permitido.");
    return cents;
  }
  function tariffInputNodes(){
    return Array.from($("expTariffEditor").querySelectorAll("input[data-tariff-room]"));
  }
  function tariffDiff(){
    const changed=[];
    for(const input of tariffInputNodes()){
      const key=input.dataset.tariffRoom,tier=Number(input.dataset.tariffTier);
      const meal=input.dataset.tariffMeal,year=Number($("expTariffYear").value),hotel=$("expTariffHotel").value;
      const cents=parseTariffPrice(input.value);
      const original=tariffSnapshot?.[year]?.[hotel]?.[meal]?.[key]?.[tier];
      if(original===undefined)throw new Error("Categoria de tarifário não cadastrada.");
      input.classList.toggle("dirty",cents!==original);
      input.classList.remove("invalid");
      if(cents!==original)changed.push({year,hotel,meal,room:key,tier,price_cents:cents});
    }
    return changed;
  }
  function onTariffInput(){
    try{
      const diff=tariffDiff();
      tariffDirty=diff.length>0;
      $("expTariffSave").disabled=!tariffDirty;
      $("expTariffStatus").classList.remove("error");
      $("expTariffStatus").textContent=diff.length>0?
        diff.length+" preço(s) alterado(s). Clique em Salvar alterações para publicar a todos os operadores.":
        "Tarifas carregadas. Nenhuma alteração pendente.";
    }catch(err){
      tariffDirty=true;
      $("expTariffSave").disabled=true;
      $("expTariffStatus").classList.add("error");
      $("expTariffStatus").textContent="Verifique os valores inseridos: "+err.message;
    }
  }
  function renderTariffEditor(){
    if(!currentUser?.is_admin)return;
    const matrix=window.lagoaTariffAPI?.getCurrent();
    if(!matrix){$("expTariffStatus").textContent="Não foi possível carregar o motor tarifário.";return;}
    const year=Number($("expTariffYear").value),hotel=$("expTariffHotel").value;
    const hotelPrices=matrix?.[year]?.[hotel];
    if(!hotelPrices){$("expTariffStatus").textContent="Tarifário não encontrado.";return;}
    tariffSnapshot=matrix;
    tariffDirty=false;
    $("expTariffSave").disabled=true;
    const html=[];
    for(const meal of ["CAFE","MAP","FAP"]){
      const rows=hotelPrices[meal];
      html.push('<section class="exp-tariff-section"><h3>'+tariffLabels[meal]+
        ' <small style="font-weight:normal">• valores por diária em R$</small></h3><div class="exp-tariff-table-wrap">'+
        '<table class="exp-tariff-table"><thead><tr><th>Categoria</th>'+
        tierNames.map(name=>'<th>'+name+'</th>').join("")+'</tr></thead><tbody>');
      for(const [room,prices] of Object.entries(rows)){
        html.push('<tr><th>'+tariffLabels[room]+'</th>');
        for(let tier=0;tier<4;tier++){
          const price=prices[tier],incomplete=year===2026&&hotel==="eco"&&tier===3;
          html.push('<td><input class="exp-tariff-input" type="text" inputmode="decimal" spellcheck="false" autocomplete="off" '+
            'data-tariff-meal="'+meal+'" data-tariff-room="'+room+'" data-tariff-tier="'+tier+'" '+
            'aria-label="'+meal+' '+room+' '+tierNames[tier]+'" value="'+tariffFormat(price)+'">'+
            (incomplete?'<small class="exp-tariff-cell-note">Super Alta: confirmar</small>':'')+'</td>');
        }
        html.push('</tr>');
      }
      html.push('</tbody></table></div></section>');
    }
    $("expTariffEditor").innerHTML=html.join("");
    tariffInputNodes().forEach(input=>input.addEventListener("input",onTariffInput));
    const note=year===2026&&hotel==="eco"?
      "Eco Towers 2026: valores de Baixa, Média e Alta atualizados conforme tabela Pública/Comissionada. Coluna Super Alta mantida do tarifário anterior, pois a imagem enviada estava incompleta.":
      "Os valores exibidos são os preços atualmente considerados pelo simulador. Altere apenas com base no novo tarifário oficial.";
    $("expTariffStatus").classList.remove("error");
    $("expTariffStatus").textContent=note;
  }
  function switchTariffGroup(element,previous){
    if(tariffDirty&&!confirm("Há preços não salvos. Deseja descartar as alterações?")){
      element.value=previous;return previous;
    }
    renderTariffEditor();return element.value;
  }
  async function saveTariffEditor(){
    if(!currentUser?.is_admin)return;
    let changes;
    try{changes=tariffDiff();}catch(err){toast(err.message,true);return;}
    if(!changes.length){toast("Nenhum preço foi alterado.");return;}
    $("expTariffSave").disabled=true;
    $("expTariffStatus").textContent="Salvando alterações na base central...";
    try{
      const response=await request("tariffs_save",{changes});
      await syncTariffs();
      renderTariffEditor();
      await refreshTariffHistory();
      toast(response.updated+" preço(s) atualizado(s) com sucesso. Todos os operadores receberão o novo tarifário.");
    }catch(err){
      $("expTariffSave").disabled=false;
      $("expTariffStatus").classList.add("error");
      $("expTariffStatus").textContent="Não foi possível salvar: "+err.message;
      toast("Falha ao salvar preços: "+err.message,true);
    }
  }
  async function refreshTariffEditor(){
    if(tariffDirty&&!confirm("Há alterações pendentes. Deseja descartá-las e recarregar as tarifas do servidor?"))return;
    try{await syncTariffs();renderTariffEditor();toast("Tabela atualizada com os preços publicados.");}
    catch(err){toast("Não foi possível consultar os tarifários: "+err.message,true);}
  }
  async function refreshTariffHistory(){
    if(!currentUser?.is_admin)return;
    const tbody=$("expTariffHistory");
    tbody.innerHTML='<tr><td colspan="8" class="exp-loading">Carregando histórico...</td></tr>';
    try{
      const result=await request("tariffs_history");
      const rows=result.rows||[];
      tbody.innerHTML=rows.length?rows.map(r=>'<tr><td>'+
        new Date(r.changed_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})+'</td><td>'+
        escapeHtml(r.operator_name)+'</td><td>'+escapeHtml(r.year+' / '+(tariffLabels[r.hotel]||r.hotel))+
        '</td><td>'+escapeHtml(r.meal)+'</td><td>'+escapeHtml(r.room)+'</td><td>'+
        escapeHtml(tierNames[r.tier])+'</td><td>'+
        (r.previous_override_cents===null?'—':fmtMoney(r.previous_override_cents))+'</td><td>'+
        fmtMoney(r.price_cents)+'</td></tr>').join(""):
        '<tr><td colspan="8" class="exp-loading">Nenhuma alteração registrada ainda.</td></tr>';
    }catch(err){tbody.innerHTML='<tr><td colspan="8" class="exp-loading">'+escapeHtml(err.message)+'</td></tr>';}
  }
  function openPasswordDialog(){
    $("expPasswordDialog").showModal();$("expCurrentPassword").value="";$("expNewPassword").value="";
    $("expNewPasswordConfirm").value="";$("expPasswordError").hidden=true;
  }
  async function changePassword(event){
    event.preventDefault();
    const old_password=$("expCurrentPassword").value,new_password=$("expNewPassword").value;
    if(new_password.length<8){$("expPasswordError").textContent="A nova senha precisa ter pelo menos oito caracteres.";$("expPasswordError").hidden=false;return;}
    if(new_password!==$("expNewPasswordConfirm").value){$("expPasswordError").textContent="A confirmação da nova senha é diferente.";$("expPasswordError").hidden=false;return;}
    try{await request("change_password",{old_password,new_password});
      $("expPasswordDialog").close();toast("Senha alterada com sucesso.");
    }catch(err){$("expPasswordError").textContent=err.message;$("expPasswordError").hidden=false;}
  }
  async function boot(){
    showAuth();
    $("expAuthForm").addEventListener("submit",login);
    $("expOperatorSelect").addEventListener("change",()=>{
      // Evita reutilizar senha salva/preenchida de outro colaborador.
      $("expPassword").value="";
      $("expPassword").type="password";
      $("expTogglePassword").textContent="Mostrar";
      $("expTogglePassword").setAttribute("aria-pressed","false");
      $("expTogglePassword").setAttribute("aria-label","Mostrar senha");
      $("expAuthError").hidden=true;
    });
    $("expTogglePassword").addEventListener("click",()=>{
      const field=$("expPassword"),button=$("expTogglePassword");
      const reveal=field.type==="password";
      field.type=reveal?"text":"password";
      button.textContent=reveal?"Ocultar":"Mostrar";
      button.setAttribute("aria-pressed",String(reveal));
      button.setAttribute("aria-label",reveal?"Ocultar senha":"Mostrar senha");
    });
    $("expLogoutBtn").addEventListener("click",logout);
    $("expAdminLogout").addEventListener("click",logout);
    $("expApplyFilters").addEventListener("click",refreshAdmin);
    $("expDownloadExcel").addEventListener("click",exportXlsx);
    $("expTabReports").addEventListener("click",()=>setAdminTab("reports"));
    $("expTabTariffs").addEventListener("click",()=>setAdminTab("tariffs"));
    $("expTariffReload").addEventListener("click",refreshTariffEditor);
    $("expTariffSave").addEventListener("click",saveTariffEditor);
    $("expTariffHistoryReload").addEventListener("click",refreshTariffHistory);
    let previousYear=$("expTariffYear").value,previousHotel=$("expTariffHotel").value;
    $("expTariffYear").addEventListener("change",()=>{
      previousYear=switchTariffGroup($("expTariffYear"),previousYear);
    });
    $("expTariffHotel").addEventListener("change",()=>{
      previousHotel=switchTariffGroup($("expTariffHotel"),previousHotel);
    });
    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden&&currentUser&&!currentUser.is_admin)
        syncTariffs(true).catch(err=>toast("Não foi possível verificar o tarifário atualizado: "+err.message,true));
    });
    setInterval(()=>{
      if(currentUser&&!currentUser.is_admin)
        syncTariffs(true).catch(err=>toast("Falha ao sincronizar o tarifário: "+err.message,true));
    },120000);
    $("expPasswordForm").addEventListener("submit",changePassword);
    $("expChangePassword").addEventListener("click",openPasswordDialog);
    $("expAdminPassword").addEventListener("click",openPasswordDialog);
    $("expPasswordCancel").addEventListener("click",()=>$("expPasswordDialog").close());
    document.querySelectorAll("[data-exp-period]").forEach(b=>b.addEventListener("click",()=>{
      const n=Number(b.dataset.expPeriod);$("expDateStart").value=daysAgo(n-1);$("expDateEnd").value=today();refreshAdmin();
    }));
    // Só ações explícitas geram registros; recalcular ao digitar não conta orçamento.
    $("refreshBtn")?.addEventListener("click",()=>{
      if(!currentUser||currentUser.is_admin||!state.quote)return;
      clearTimeout(simulateTimer);
      lastSimSignature=quoteFingerprint(state.quote);
      record("simulate",state.quote,true);
    });
    window.addEventListener("lagoa:quote-changed",event=>queueSimulation(event.detail?.quote||null));
    window.addEventListener("lagoa:quote-copied",event=>completedAction("copy",event.detail?.quote));
    window.addEventListener("lagoa:quote-pdf",event=>completedAction("pdf",event.detail?.quote));
    try{
      await loadPeople();
      if(token){
        try{const me=await request("me");currentUser=me.user;
          sessionQuotes=Number(me.session_quotes)||0;
          await syncTariffs();
          if(currentUser.is_admin)showAdmin(currentUser);else showOperator(currentUser);
          if(currentUser.must_change_password)toast("Senha padrão em uso. Recomenda-se alterá-la.");
        }catch{token="";sessionStorage.removeItem(STORAGE_KEY);showAuth();}
      }
      $("expLoginBtn").disabled=false;$("expLoginBtn").textContent="Entrar na plataforma";
    }catch(err){
      $("expAuthError").textContent="Não foi possível carregar os operadores: "+err.message;$("expAuthError").hidden=false;
      $("expLoginBtn").disabled=true;$("expLoginBtn").textContent="Aguardando conexão";
      const retry=document.createElement("button");retry.type="button";retry.className="exp-secondary exp-auth-submit";retry.textContent="Tentar reconectar";retry.addEventListener("click",()=>{retry.remove();bootReconnect();});
      $("expAuthError").after(retry);
    }
  }
  async function bootReconnect(){
    try{await loadPeople();$("expAuthError").hidden=true;$("expLoginBtn").disabled=false;$("expLoginBtn").textContent="Entrar na plataforma";}
    catch(err){toast(err.message,true);}
  }
  document.addEventListener("DOMContentLoaded",boot);
})();