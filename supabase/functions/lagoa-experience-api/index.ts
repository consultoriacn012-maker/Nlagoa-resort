// Lagoa Experience - API de autenticação e produtividade
// Código de servidor: nenhuma senha ou chave secreta é enviada ao navegador.
const SUPA_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SECRET_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const allowedOrigins=new Set([
  "https://lagoa-simulador-reserva-experience.onrender.com",
  "https://lagoa-simulador-reservas-2027.onrender.com"
]);
const textEncoder=new TextEncoder();
function cors(origin:string|null):Record<string,string>{
  const headers:Record<string,string>={
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Vary":"Origin",
    "Access-Control-Allow-Headers":"authorization, content-type, apikey",
    "Access-Control-Allow-Methods":"POST,OPTIONS"
  };
  if(origin&&allowedOrigins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
  return headers;
}
function respond(data:unknown,status=200,origin:string|null=null):Response{
  return new Response(JSON.stringify(data),{status,headers:cors(origin)});
}
async function digest(value:string):Promise<string>{
  const hash=await crypto.subtle.digest("SHA-256",textEncoder.encode(value));
  return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
function randomToken():string{
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return [...bytes].map(n=>n.toString(16).padStart(2,"0")).join("");
}
async function db(path:string,method="GET",payload:unknown=undefined):Promise<any>{
  if(!SUPA_URL||!SERVICE_KEY)throw new Error("Configuração do servidor incompleta.");
  const headers:Record<string,string>={
    "apikey":SERVICE_KEY,"Content-Type":"application/json",
    "Accept":"application/json","Prefer":"return=representation"
  };
  if(!SERVICE_KEY.startsWith("sb_secret_"))headers["Authorization"]="Bearer "+SERVICE_KEY;
  const res=await fetch(SUPA_URL+"/rest/v1/"+path,{method,headers,
    ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
  if(res.status===204)return [];
  const raw=await res.text();
  if(!res.ok){
    console.error("experience db error",method,path.split("?")[0],res.status,raw.slice(0,220));
    throw new Error("Não foi possível consultar o banco de dados.");
  }
  return raw?JSON.parse(raw):[];
}
function eq(value:string):string{return encodeURIComponent(value);}
function validUuid(id:string):boolean{return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id);}
function isDate(s:unknown):s is string{
  if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+"T12:00:00Z");
  return !isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s;
}
function brDay():string{
  return new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
async function userFromToken(req:Request):Promise<any>{
  const auth=req.headers.get("Authorization")||"";
  if(!/^Bearer [a-f0-9]{64}$/i.test(auth))return null;
  const token=auth.slice(7),hash=await digest(token);
  const sessions=await db("experience_sessions?token_hash=eq."+hash+"&select=token_hash,user_id,expires_at,revoked_at&limit=1");
  const session=sessions[0];
  if(!session||session.revoked_at||Date.parse(session.expires_at)<=Date.now())return null;
  const users=await db("experience_users?id=eq."+eq(session.user_id)+"&select=id,display_name,is_admin,active,must_change_password&limit=1");
  if(!users[0]?.active)return null;
  return {...users[0],session_hash:hash};
}
function cleanQuote(input:any):any{
  const q=input&&typeof input==="object"?input:{};
  if(!["eco","jardins"].includes(q.hotel)||![2026,2027].includes(q.year)||
   !["CAFE","MAP","FAP"].includes(q.meal)||!isDate(q.checkin)||!isDate(q.checkout)||
   q.checkout<=q.checkin||q.checkin.slice(0,4)!==String(q.year)||
   q.checkout>String(q.year+1)+"-01-01")throw new Error("Hospedagem ou período inválido.");
  if(q.meal==="MAP"&&!["almoco","jantar"].includes(q.map_choice))
    throw new Error("Selecione o regime MAP.");
  for(const k of ["adults","children","nights","total_cents","discount_cents","net_cents","ceia_cents","grand_total_cents"]){
    if(!Number.isSafeInteger(q[k])||q[k]<0||q[k]>1e9)throw new Error("Valores da simulação inválidos.");
  }
  if(q.adults<1||q.adults>30||q.children>29||q.adults+q.children>30||q.nights<1||q.nights>366)
    throw new Error("Ocupação da simulação inválida.");
  if(!Array.isArray(q.children_ages)||q.children_ages.length!==q.children||
    q.children_ages.some((a:unknown)=>!["0-6","7-11","12"].includes(String(a))))
    throw new Error("Idades infantis incompletas.");
  const nights=Math.round((Date.parse(q.checkout+"T00:00:00Z")-Date.parse(q.checkin+"T00:00:00Z"))/86400000);
  if(q.nights!==nights)throw new Error("Quantidade de noites inconsistente.");
  const percent=Number(q.discount_pct);
  if(!Number.isFinite(percent)||percent<0||percent>100)throw new Error("Desconto inválido.");
  const bp=Math.round(percent*100);
  if(q.total_cents-q.discount_cents!==q.net_cents||
     q.net_cents+q.ceia_cents!==q.grand_total_cents||
     Math.round(q.total_cents*bp/10000)!==q.discount_cents)
    throw new Error("Totais do orçamento inconsistentes.");
  const nightsWithCeia=q.year===2026?
    ["2026-12-24","2026-12-31"].filter(d=>q.checkin<=d&&d<q.checkout).length:0;
  const expectedCeia=nightsWithCeia*((q.adults+q.children_ages.filter((a:string)=>a==="12").length)*45000+
    q.children_ages.filter((a:string)=>a==="7-11").length*22500);
  if(expectedCeia!==q.ceia_cents)throw new Error("Adicional de ceia inconsistente.");
  return {hotel:q.hotel,year:q.year,checkin:q.checkin,checkout:q.checkout,
    meal:q.meal,map_choice:q.meal==="MAP"?q.map_choice:"",
    adults:q.adults,children:q.children,children_ages:q.children_ages,
    nights:q.nights,discount_pct:Math.round(percent*100)/100,
    total_cents:q.total_cents,discount_cents:q.discount_cents,
    net_cents:q.net_cents,ceia_cents:q.ceia_cents,grand_total_cents:q.grand_total_cents};
}
async function fetchAll(path:string,max=30000):Promise<{items:any[],truncated:boolean}>{
  const items:any[]=[];const pageSize=1000;
  for(let offset=0;offset<max;offset+=pageSize){
    const part=await db(path+(path.includes("?")?"&":"?")+"limit="+pageSize+"&offset="+offset);
    items.push(...part);
    if(part.length<pageSize)return {items,truncated:false};
  }
  return {items,truncated:true};
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin");
  if(origin&&!allowedOrigins.has(origin))return respond({ok:false,error:"Origem não autorizada."},403,null);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return respond({ok:false,error:"Método inválido."},405,origin);
  try{
    const length=Number(req.headers.get("content-length")||"0");
    if(length>50000)return respond({ok:false,error:"Requisição muito grande."},413,origin);
    const body=await req.json();
    const action=String(body.action||"");
    if(action==="operators"){
      const operators=await db("experience_users?active=eq.true&select=id,display_name,is_admin&order=display_name.asc");
      return respond({ok:true,operators},200,origin);
    }
    if(action==="login"){
      const id=String(body.user_id||""),password=String(body.password||"");
      if(!validUuid(id)||!password||password.length>128)return respond({ok:false,error:"Usuário ou senha incorretos."},401,origin);
      const lookup=await db("experience_users?id=eq."+eq(id)+"&active=eq.true&select=id&limit=1");
      if(!lookup.length)return respond({ok:false,error:"Usuário ou senha incorretos."},401,origin);
      const after=new Date(Date.now()-15*60*1000).toISOString();
      const failures=await db("experience_login_attempts?user_id=eq."+eq(id)+
        "&succeeded=eq.false&created_at=gte."+eq(after)+"&select=id&limit=8");
      if(failures.length>=7)return respond({ok:false,error:"Muitas tentativas. Aguarde 15 minutos para tentar novamente."},429,origin);
      const verified=await db("rpc/experience_verify_password","POST",{p_user_id:id,p_password:password});
      await db("experience_login_attempts","POST",{user_id:id,succeeded:verified.length>0});
      if(!verified.length)return respond({ok:false,error:"Usuário ou senha incorretos."},401,origin);
      const u=verified[0],token=randomToken(),hash=await digest(token);
      await db("experience_sessions","POST",{token_hash:hash,user_id:u.user_id,
        expires_at:new Date(Date.now()+(u.is_admin?4:12)*3600000).toISOString()});
      return respond({ok:true,token,user:{id:u.user_id,display_name:u.display_name,
        is_admin:u.is_admin,must_change_password:u.must_change_password}},200,origin);
    }
    const u=await userFromToken(req);
    if(!u)return respond({ok:false,error:"Sessão expirada ou acesso não autorizado. Entre novamente."},401,origin);
    if(action==="me")return respond({ok:true,user:{id:u.id,display_name:u.display_name,
      is_admin:u.is_admin,must_change_password:u.must_change_password}},200,origin);
    if(action==="logout"){
      await db("experience_sessions?token_hash=eq."+u.session_hash,"PATCH",{revoked_at:new Date().toISOString()});
      return respond({ok:true},200,origin);
    }
    if(action==="change_password"){
      const old=String(body.old_password||""),next=String(body.new_password||"");
      if(next.length<8||next.length>128||next===old)
        return respond({ok:false,error:"Use uma nova senha diferente, de 8 a 128 caracteres."},400,origin);
      const updated=await db("rpc/experience_change_password","POST",
        {p_user_id:u.id,p_old_password:old,p_new_password:next});
      if(updated!==true)return respond({ok:false,error:"Senha atual incorreta."},400,origin);
      await db("experience_sessions?user_id=eq."+eq(u.id)+"&token_hash=neq."+u.session_hash,
        "PATCH",{revoked_at:new Date().toISOString()});
      return respond({ok:true},200,origin);
    }
    if(action==="record"){
      if(u.is_admin)return respond({ok:false,error:"Administrador não registra orçamentos comerciais."},403,origin);
      const kind=String(body.event_type||"");
      if(!["simulate","copy","pdf"].includes(kind))return respond({ok:false,error:"Ação inválida."},400,origin);
      const q=cleanQuote(body.quote);
      const fingerprint=await digest(JSON.stringify(q));
      const date=brDay();
      const existing=await db("experience_quotes?session_hash=eq."+u.session_hash+
        "&fingerprint=eq."+fingerprint+"&select=id&limit=1");
      let quoteId=existing[0]?.id||null,created=false;
      if(!quoteId){
        try{
          const saved=await db("experience_quotes","POST",{
            user_id:u.id,session_hash:u.session_hash,fingerprint,local_date:date,
            ...q,source_action:kind
          });
          quoteId=saved[0]?.id||null;created=!!quoteId;
        }catch(err){
          const recovered=await db("experience_quotes?session_hash=eq."+u.session_hash+
            "&fingerprint=eq."+fingerprint+"&select=id&limit=1");
          if(!recovered.length)throw err;
          quoteId=recovered[0].id;
        }
      }
      if(!quoteId)throw new Error("Não foi possível registrar o orçamento.");
      await db("experience_actions","POST",{quote_id:quoteId,user_id:u.id,event_type:kind,local_date:date});
      return respond({ok:true,id:quoteId,created},200,origin);
    }
    if(action==="analytics"){
      if(!u.is_admin)return respond({ok:false,error:"Acesso exclusivo do administrador."},403,origin);
      const start=String(body.date_from||""),end=String(body.date_to||""),userId=body.user_id?String(body.user_id):"";
      if(!isDate(start)||!isDate(end)||end<start||end.slice(0,4)<"2026"||
         Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z")>365*3*86400000)
        return respond({ok:false,error:"Informe um intervalo de até três anos."},400,origin);
      if(userId&&!validUuid(userId))return respond({ok:false,error:"Operador inválido."},400,origin);
      const filter="local_date=gte."+eq(start)+"&local_date=lte."+eq(end)+(userId?"&user_id=eq."+eq(userId):"");
      const records=await fetchAll("experience_quotes?"+filter+
        "&select=id,user_id,local_date,created_at,hotel,year,checkin,checkout,nights,adults,children,children_ages,meal,map_choice,discount_pct,total_cents,discount_cents,net_cents,ceia_cents,grand_total_cents,source_action&order=created_at.desc",30000);
      const actions=await fetchAll("experience_actions?"+filter+
        "&select=quote_id,event_type&order=created_at.desc",50000);
      const people=await db("experience_users?select=id,display_name,is_admin");
      const peopleMap=new Map(people.map((o:any)=>[o.id,o.display_name]));
      const actionsByQuote=new Map<string,{simulations:number,copies:number,pdfs:number}>();
      for(const act of actions.items){
        const e=actionsByQuote.get(act.quote_id)||{simulations:0,copies:0,pdfs:0};
        if(act.event_type==="simulate")e.simulations++;
        else if(act.event_type==="copy")e.copies++;
        else if(act.event_type==="pdf")e.pdfs++;
        actionsByQuote.set(act.quote_id,e);
      }
      const rows=records.items.map((q:any)=>({
        ...q,operator_name:peopleMap.get(q.user_id)||"Operador desconhecido",
        ...(actionsByQuote.get(q.id)||{simulations:0,copies:0,pdfs:0})
      }));
      return respond({ok:true,rows,truncated:records.truncated||actions.truncated},200,origin);
    }
    return respond({ok:false,error:"Ação desconhecida."},400,origin);
  }catch(err){
    console.error("experience api",err instanceof Error?err.message:"erro");
    return respond({ok:false,error:err instanceof Error&&
      !err.message.includes("banco")?err.message:"Erro interno ao processar a solicitação."},500,origin);
  }
});
