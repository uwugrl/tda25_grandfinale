[Čeština](README_CZ.md) | [English](README.md)

# Think different Academy

> Varování: Tento kód byl napsán během 7 hodin, a toto je na kódu znatelné. Jelikož tento projekt byl součástí soutěže, a já mám na starosti ostatní projekty, není tento project podporován.
> Tímto naznačuji že všechny bugy nalezeny v této aplikaci jsou funkce.

Apka pro grandfinále soutěže [Tour de App](https://tourde.app/).

## Vytvořili

- mldchan - [Web](https://mldchan.dev/), [GitHub](https://github.com/mldchan), [code.mldchan.dev](https://code.mldchan.dev/mld), [Fedi](https://social.mldchan.dev/@mld)
- krystof - [code.mldchan.dev](https://code.mldchan.dev/Krysunka), [Fedi](https://social.mldchan.dev/@Krysunka)

## O aplikaci

Aplikace je vytvořena pomocí NextJS a TailwindCSS. Používáme Prismu pro návrh databáze a SQLite aby jsme data uložili na
disk.

## Vývoj

Pokud chcete spustit tuto aplikaci ve vývoji, můžete použít následující příkazy:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - naklonování repozitáře (popřípadě použít GitHub)
2. `cd tda25_grandfinale` - přesun do složky s projektem
3. `yarn install` - stažení knihoven
4. `yarn dev` - spuštění vývojového serveru

## Stavba do produkce

Pokud chcete aplikaci postavit do produkce, můžete použít následující příkazy:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - naklonování repozitáře (popřípadě použít GitHub)
2. `cd tda25_grandfinale` - přesun do složky s projektem
3. `yarn install` - stažení knihoven
4. `yarn build` - sestavení aplikace

Naše aplikace jde také postavit jako Docker image. Pro to je potřeba mít nainstalovaný Docker. Pokud ho máte, můžete
použít následující příkazy:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - naklonování repozitáře (popřípadě použít GitHub)
2. `cd tda25_grandfinale` - přesun do složky s projektem
3. `docker build -t tda25_grandfinale:latest .` - sestavení Docker image

Aplikace běží na portu 80, pomocí `docker run -p 80:80 tda25_grandfinale:latest` můžete spustit aplikaci.

## Licence

Celá aplikace je pod licencí GNU AGPL v3. Tato licence je určena pro webové aplikace. Každá aplikace používající náš
kód musí být pod stejnou licencí. Pro více informací se podívejte do souboru `LICENSE`.
