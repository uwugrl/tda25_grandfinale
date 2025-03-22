import "@/styles/globals.css";
import { CssVarsProvider, extendTheme } from "@mui/joy";
import type { AppProps } from "next/app";
import localFont from 'next/font/local'

const dosis = localFont({ src: './fonts/Dosis.ttf' });

const theme = extendTheme({
  fontFamily: {
    body: dosis.style.fontFamily,
    display: dosis.style.fontFamily
  }
})


export default function App({ Component, pageProps }: AppProps) {
  return <CssVarsProvider theme={theme}>
    <Component {...pageProps} />
  </CssVarsProvider>
}
