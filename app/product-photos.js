'use client'
import {useEffect,useRef,useState} from 'react'
import {Icon} from './experience'
export async function prepareProductPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error(`${file.name}: use a JPG, PNG or WebP image. Export HEIC photos as JPG first.`)
 if(file.size>8*1024*1024)throw Error(`${file.name}: choose a photo smaller than 8 MB.`)
 const url=URL.createObjectURL(file)
 try{
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`${file.name}: this image could not be opened. Try another photo.`));img.src=url})
 if(!image.naturalWidth||!image.naturalHeight)throw Error('This photo has no usable image data.')
 const scale=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale)
 const context=canvas.getContext('2d');if(!context)throw Error('This browser could not prepare the image. Try a JPG in a recent browser.');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height)
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.86));if(!blob)throw Error('The image could not be prepared. Try another photo.')
 return new File([blob],file.name.replace(/\.[^.]*$/,'')+'.jpg',{type:'image/jpeg'})
 }finally{URL.revokeObjectURL(url)}
}
export function ProductPhotoEditor({value,onChange,disabled,onBusyChange}){
 const [previews,setPreviews]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),input=useRef(null)
 useEffect(()=>{const urls=value.images.map(f=>URL.createObjectURL(f));setPreviews(urls);return()=>urls.forEach(URL.revokeObjectURL)},[value.images])
 async function add(files){if(busy||disabled)return;setError('');const incoming=Array.from(files);if(value.existingImages.length+value.images.length+incoming.length>4){setError('You can use up to four photos. Remove a photo before adding its replacement.');return}setBusy(true);onBusyChange?.(true);try{const photos=[];for(const file of incoming)photos.push(await prepareProductPhoto(file));onChange({...value,images:[...value.images,...photos]})}catch(e){setError(e.message)}finally{setBusy(false);onBusyChange?.(false);if(input.current)input.current.value=''}}
 return <fieldset className="it-photo-editor" disabled={disabled||busy}><legend>Product photos</legend><p>Up to four photos. JPG, PNG or WebP, up to 8 MB each. The first photo is the cover.</p><div className="it-photo-grid">{value.existingImages.map((url,i)=><figure key={url}><img src={url} alt={`Saved product photo ${i+1}`}/><button type="button" onClick={()=>onChange({...value,existingImages:value.existingImages.filter((_,n)=>n!==i)})} aria-label={`Remove saved photo ${i+1}`}><Icon name="close"/></button>{i===0&&<figcaption>Cover</figcaption>}</figure>)}{previews.map((url,i)=><figure key={url}><img src={url} alt={`New product photo ${i+1}`}/><button type="button" aria-label={`Remove new photo ${i+1}`} onClick={()=>onChange({...value,images:value.images.filter((_,n)=>n!==i)})}><Icon name="close"/></button>{i===0&&!value.existingImages.length&&<figcaption>Cover</figcaption>}</figure>)}</div><div className="it-photo-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(e.dataTransfer.files)}}><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>add(e.target.files)} aria-label="Choose product photos"/><span>{busy?'Preparing photos…':'Choose photos or drop them here'}</span></div>{error&&<p role="alert">{error}</p>}</fieldset>
}
