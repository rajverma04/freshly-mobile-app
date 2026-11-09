import { useAuth } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { OrdersScreen } from '../../modules/orders/OrdersScreen';
import { AuthScreen } from '../../modules/auth/AuthScreen';
export default function Orders(){
 const {isSignedIn}=useAuth();
 const [focused,setFocused]=useState(false);
 useFocusEffect(useCallback(()=>{setFocused(true);return()=>setFocused(false);},[]));
 return !focused?null:isSignedIn?<OrdersScreen/>:<AuthScreen/>;
}
