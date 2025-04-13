import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import Head from 'next/head'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Tamagotchi Fitness | Last Meal Protocol</title>
        <meta name="description" content="Track your fitness goals with your virtual pet companion" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:url" content="https://last-meal-protocol.club" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}