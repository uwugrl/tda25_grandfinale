import { Typography } from "@mui/joy";
import Header from "./components/Header";

export default function Features() {
  return (
    <>
      <br />
      <br />
      <br />
      <br />
      <br />


      <div className="w-2/3 m-auto">
          <Typography level="h1" textAlign={"center"}>Funkce naší aplikace</Typography>
          <ul>
            <li><Typography>F-014 (30b) - Pro připojení využití QR kódu vygenerovaném na UI admina</Typography></li>
            <li><Typography>F-005 (20b) - Pokud dojde omylem k odpojení, má uživatel možnost so znovu připojit</Typography></li>
            <li><Typography>F-009 (30b) - Pokud dojde omylem k odpojení, má uživatel možnost so znovu připojit</Typography></li>
          </ul>
      </div>

      <Header />
    </>
  )
}