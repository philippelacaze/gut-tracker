import{a as m,b as p,c as d}from"./chunk-FYP4C75K.js";import{a as l,b as c,c as u}from"./chunk-JGYPQ263.js";import{E as o,I as n,_ as r}from"./chunk-WRWDFJ7O.js";var v=`Tu es un assistant sp\xE9cialis\xE9 en reconnaissance alimentaire.
Analyse uniquement ce que tu vois clairement sur cette photo.
NE PAS extrapoler, NE PAS supposer des ingr\xE9dients non visibles.
Si un aliment est partiellement visible ou ambigu, indique-le.

R\xE9ponds UNIQUEMENT en JSON valide, sans texte avant/apr\xE8s :
{
  "foods": [
    { "name": "Nom de l'aliment", "confidence": 0.95, "quantity": "estimation ou null" }
  ],
  "uncertain": ["aliment ambigu 1"]
}`,g=`Tu es un assistant m\xE9dical sp\xE9cialis\xE9 en troubles digestifs (SII/SIBO).
Tu analyses des donn\xE9es de suivi alimentaire et symptomatique.

IMPORTANT : Tes conclusions sont indicatives uniquement.
Commence TOUJOURS par rappeler que ceci ne remplace pas un avis m\xE9dical.

Analyse les corr\xE9lations temporelles entre prises alimentaires et sympt\xF4mes apparus dans les 0 \xE0 6 heures suivantes.
Identifie les patterns FODMAP associ\xE9s aux sympt\xF4mes.

Structure ta r\xE9ponse en sections :
1. Patterns identifi\xE9s
2. Aliments/groupes FODMAP suspects
3. Impact des traitements observ\xE9
4. Recommandations prudentes`,f=`Tu es un assistant de saisie alimentaire.
Analyse ce texte dict\xE9 et extrait les informations structur\xE9es.
Types de repas valides : breakfast (petit-d\xE9jeuner), lunch (d\xE9jeuner), dinner (d\xEEner), snack (collation), drink (boisson).

R\xE9ponds UNIQUEMENT en JSON valide, sans texte avant/apr\xE8s :
{
  "mealType": "lunch",
  "foods": [
    { "name": "pomme", "quantity": "1" }
  ],
  "notes": null
}`,P=`Tu es un assistant de saisie de sympt\xF4mes digestifs.
Analyse ce texte dict\xE9 et extrait les sympt\xF4mes mentionn\xE9s.
Types valides : pain, bloating, gas, belching, stool, headache, other.
Pour le type "stool", tu peux indiquer bristolScale (entier 1-7) si mentionn\xE9.
S\xE9v\xE9rit\xE9 : entier de 1 (minimal) \xE0 10 (extr\xEAme). Si non pr\xE9cis\xE9e, estime \xE0 5.

R\xE9ponds UNIQUEMENT en JSON valide, sans texte avant/apr\xE8s :
{
  "symptoms": [
    { "type": "bloating", "severity": 7, "locationHint": "abdomen", "note": null }
  ]
}`,h=`Tu es un assistant de saisie de m\xE9dicaments et compl\xE9ments alimentaires.
Analyse ce texte dict\xE9 et extrait les m\xE9dicaments mentionn\xE9s.
Types valides : enzyme, probiotic, antibiotic, antispasmodic, other.

R\xE9ponds UNIQUEMENT en JSON valide, sans texte avant/apr\xE8s :
{
  "medications": [
    { "name": "Creon", "type": "enzyme", "dose": "2 g\xE9lules" }
  ]
}`,_=`Tu es un expert en nutrition sp\xE9cialis\xE9 FODMAP (protocole Monash University).
Pour chaque aliment fourni, donne son score FODMAP.

R\xE9ponds UNIQUEMENT en JSON valide :
{
  "foods": [
    {
      "name": "Nom",
      "fodmapLevel": "low|medium|high",
      "score": 3,
      "mainFodmaps": ["fructose", "lactose"],
      "notes": "Explication courte"
    }
  ],
  "globalScore": 5,
  "globalLevel": "medium",
  "advice": "Conseil court sur cette prise alimentaire"
}`,y=class a{_settingsService=n(l);_openAi=n(u);_anthropic=n(m);_gemini=n(p);_ollama=n(d);_analyzing=r(!1);analyzing=this._analyzing.asReadonly();get _activeProvider(){let e=this._settingsService.getSelectedProvider(),i={openai:this._openAi,anthropic:this._anthropic,gemini:this._gemini,ollama:this._ollama}[e];if(!i)throw new c(`Provider "${e}" non disponible`,e);return i}async recognizeFood(e,t){this._analyzing.set(!0);try{let i=await this._activeProvider.analyzeImage(e,v,t);try{let s=i.match(/\{[\s\S]*\}/);return s?JSON.parse(s[0]):{foods:[],uncertain:[]}}catch{return{foods:[],uncertain:[]}}}finally{this._analyzing.set(!1)}}async analyzeFodmap(e){this._analyzing.set(!0);try{let t=`Aliments \xE0 analyser : ${e.join(", ")}`,i=await this._activeProvider.complete(t,_);try{let s=i.match(/\{[\s\S]*\}/);return s?JSON.parse(s[0]):{foods:[],advice:i,globalLevel:"low",globalScore:0}}catch{return{foods:[],advice:i,globalLevel:"low",globalScore:0}}}finally{this._analyzing.set(!1)}}async parseVoiceTranscript(e,t){this._analyzing.set(!0);let i={food:f,symptom:P,medication:h};try{return await this._activeProvider.complete(e,i[t])}finally{this._analyzing.set(!1)}}async analyzeCorrelations(e){this._analyzing.set(!0);try{let t=`Donn\xE9es fournies :
${e}`;return await this._activeProvider.complete(t,g)}finally{this._analyzing.set(!1)}}static \u0275fac=function(t){return new(t||a)};static \u0275prov=o({token:a,factory:a.\u0275fac,providedIn:"root"})};export{y as a};
/**i18n:185be897c39810308387c12f12d03cfc55693f2502a2b367905371172c1f632a*/
