import "@/styles/globals.css";
import { CssVarsProvider, extendTheme } from "@mui/joy";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} /> 
}
