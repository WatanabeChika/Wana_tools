import{_ as r,r as u,a as v,c as x,e as c,f as d,b as t,p as h,g as m}from"./index-cf4f9bb1.js";const l=a=>(h("data-v-1dacbbae"),a=a(),m(),a),b={id:"m2kcontainer"},f=l(()=>t("h1",null,"反斜杠",-1)),k=l(()=>t("label",{id:"in-out"},"带反斜杠的命令: ",-1)),B=l(()=>t("label",{id:"in-out"},"不带反斜杠的命令: ",-1)),I={__name:"Backslash",setup(a){const n=u(""),o=u(""),i=()=>{let e=n.value.replace(/\n/g," ").replace(/\\/g,"").replace(/\s+/g," ").trim();o.value=e},_=()=>{let e=o.value.replace(/\s+/g," ").trim().replace(/ /g,` \\
`);n.value=e};return(p,e)=>(v(),x("div",b,[f,k,c(t("textarea",{type:"text",id:"inputBox","onUpdate:modelValue":e[0]||(e[0]=s=>n.value=s),placeholder:`sudo rm -rf \\ 
I \\ 
dont \\ 
want \\ 
backslash`,onInput:i},null,544),[[d,n.value]]),B,c(t("textarea",{type:"text",id:"outputBox","onUpdate:modelValue":e[1]||(e[1]=s=>o.value=s),placeholder:"sudo rm -rf I dont want backslash",onInput:_},null,544),[[d,o.value]])]))}},w=r(I,[["__scopeId","data-v-1dacbbae"]]);export{w as default};
