import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from './api';
export function useResource<T>(path: string) {
 const api = useApi();
 const [state, setState] = useState<{path:string;data?:T;error:string;loading:boolean}>({path:'',error:'',loading:true});
 const sequence = useRef(0);
 const fetchResource = useCallback(async () => {
  const id = ++sequence.current;
  try {
   const data = await api<T>(path);
   if(id === sequence.current) setState({path,data,error:'',loading:false});
  } catch(error) {
   if(id === sequence.current) setState({path,error:error instanceof Error?error.message:'Could not connect.',loading:false});
  }
 },[api,path]);
 const reload=useCallback(()=>{setState(current=>({...current,loading:true,error:''}));void fetchResource();},[fetchResource]);
 useEffect(()=>{
  // State updates occur only after the awaited network request settles.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void fetchResource();
  return ()=>{
   // This is a request generation counter, not a DOM ref; invalidate pending responses.
   // eslint-disable-next-line react-hooks/exhaustive-deps
   sequence.current++;
  };
 },[fetchResource]);
 return {data:state.path===path?state.data:undefined,error:state.path===path?state.error:'',loading:state.path!==path||state.loading,reload};
}
