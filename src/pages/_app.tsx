import "@/styles/globals.css";
import { CssVarsProvider, extendTheme } from "@mui/joy";
import type { AppProps } from "next/app";

const theme = extendTheme({
  fontSize: {
      sm: '20px',
      md: '24px',
      lg: '28px',
      xl: '32px'
  },
  colorSchemes: {
      dark: {
          palette: {
              background: {
                  surface: '1a1a1a'
              }
          }
      }
  }
})

export default function App({ Component, pageProps }: AppProps) {
  return <CssVarsProvider theme={theme}>
    <Component {...pageProps} />
  </CssVarsProvider>;
}
