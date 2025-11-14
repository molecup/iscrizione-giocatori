This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe Checkout (Pagamento iscrizione)

L'app integra Stripe Checkout per il pagamento della quota di iscrizione nella pagina `register/[token]`.

### Configurazione delle variabili d'ambiente

Creare un file `.env.local` nella root del progetto con le seguenti chiavi (modalità test):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Note:
- Le chiavi pubbliche iniziano con `pk_`, quelle segrete con `sk_`.
- Il file `stripe.env` presente nel repository è solo di esempio: copiare le chiavi in `.env.local` e (opzionale) rimuovere `stripe.env` dal controllo versione.

### Come funziona il flusso

- La pagina `src/app/register/[token]/page.jsx` guida l'utente attraverso: creazione account → dati giocatore → pagamento.
- Sul passo "Pagamento" il pulsante usa `@stripe/stripe-js` per creare una sessione via API e reindirizzare a Stripe Checkout.
- Endpoint server: `src/app/api/checkout/route.js` crea la `Checkout Session` usando l'SDK server `stripe`.
- Al termine, Stripe reindirizza l'utente alla stessa pagina di registrazione con query `?paid=1` (successo) oppure `?canceled=1` (annullato). La pagina gestisce automaticamente questi stati.

### Test in locale

1. Impostare `.env.local` (vedi sopra).
2. `npm run dev` e aprire `http://localhost:3000`.
3. Navigare a un URL di registrazione esistente (es. `/register/ABC123`).
4. Compilare i dati fino al pagamento e cliccare "Paga quota".
5. Su Stripe Checkout usare carte di test, per esempio `4242 4242 4242 4242`, qualsiasi data futura e CVC.

### Personalizzazioni

- Importo: viene passato dal client (es. `amount={25}` → 25,00€). La API lo riceve in centesimi.
- `customer_email` e `metadata` vengono passati alla sessione per semplificare il riconoscimento del pagamento.
- Le URL di `success`/`cancel` tornano alla pagina di registrazione con il token, derivate dall'header `referer`.

### Produzione e sicurezza

- In produzione usare chiavi live di Stripe, impostate come variabili d'ambiente sicure.
- Per confermare in modo affidabile gli esiti di pagamento lato server è consigliato aggiungere un webhook Stripe (`/api/stripe/webhook`) che riceva eventi come `checkout.session.completed` e marchi l'iscrizione come pagata nel DB.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
