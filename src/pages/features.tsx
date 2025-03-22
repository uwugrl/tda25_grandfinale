import { Typography } from "@mui/joy";

export default function Features() {
  return (
    <div className="w-2/3 m-auto">
        <Typography level="h1">Funkce naší aplikace</Typography>
        <ul>
          <li><Typography>F-014 (30b) - Pro připojení využití QR kódu vygenerovaném na UI admina</Typography></li>
          <li><Typography>F-005 (20b) - Pokud dojde omylem k odpojení, má uživatel možnost so znovu připojit</Typography></li>
        </ul>
    </div>
  )
}