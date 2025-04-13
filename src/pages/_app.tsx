import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Tamagotchi Fitness | Last Meal Protocol</title>
        <meta name="description" content="Track your fitness goals with your virtual pet companion" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:url" content="https://last-meal-protocol.club" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;