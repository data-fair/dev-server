# df-dev-server

A development server for optimal development experience of data-fair applications.

## Usage

See [data-fair-charts](https://github.com/koumoul-dev/data-fair-charts/blob/master/package.json) for an example with nuxt.
See [data-fair-minimal](https://github.com/koumoul-dev/data-fair-minimal/blob/master/package.json) for an example with a simple http server.

## Ports de développement

`df-dev-env` génère un `.env` git-ignoré portant trois ports libres consécutifs,
tirés dans 20000–29999, pour que plusieurs applications tournent en parallèle :

```
APP_PORT=24730          # le serveur de dev de l'application (Vite)
DEV_SERVER_PORT=24731   # df-dev-server
E2E_PORT=24732          # le webServer de Playwright
APP_PATH=/app/          # chemin sous lequel l'application est servie
```

Le fichier est généré une fois, au premier `npm run dev`, puis laissé tel quel.
`df-dev-env --force` retire de nouveaux ports en cas de collision, en
conservant l'`APP_PATH` déjà choisi : le remède à une collision de ports ne
doit pas replacer en silence sous `/app/` une application servie à la racine.
`--app-path` explicite prime sur la valeur conservée.

Un `.env` déjà présent est laissé intact — mais `df-dev-env` prévient quand ce
silence n'est pas ce qu'on attendait : quand le fichier ne porte pas `APP_PORT`
(un `.env` écrit pour une autre raison, qui ne recevrait donc aucun port), et
quand un `--app-path` explicite diffère de celui déjà stocké.

`df-dev-server` lit ce `.env` (`dotenv`) : `DEV_SERVER_PORT` fixe son port, et
`app.url` est dérivée de `APP_PORT` + `APP_PATH`. `APP_URL` reste prioritaire
pour une application qui n'est pas servie sur `localhost`.

`npm run dev-test-app-minimal` relit `.env` lui-même (via `dotenv-cli`) pour
faire écouter `http-server` sur le bon `APP_PORT`, mais ne peut pas agir sur
`APP_PATH` : ce script et le processus `df-dev-server` déjà démarré ne
partagent rien d'autre que le fichier `.env`, écrit une seule fois par
`df-dev-env` avec `/app/` par défaut. Pour tester `test-apps/minimal` (servie
à la racine) il faut régénérer `.env` avant de lancer le dev-server :
`node src/dev-env.js --force --app-path=`.

## Development

Run development server :

```
npm run dev

```

Run publishable server :

```
DEBUG=nuxt-config-inject npm run prepublish
DEBUG=nuxt-config-inject NODE_ENV=production node server/index.js
```
