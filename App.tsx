import React, { useCallback, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'

import { Home } from './src/screens'

export default function App() {
  const SplashScreenHide = useCallback(async () => {
    await SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    setTimeout(() => {
      SplashScreenHide()
    }, 300)
  }, [])

  return (
    <>
      <StatusBar style="auto" />
      <Home />
    </>
  )
}