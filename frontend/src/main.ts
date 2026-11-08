import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  console.error('SoapyFUN bootstrap error:', error);
  const host = document.querySelector('soapy-root');
  if (host) {
    host.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#fbfaf8;font-family:system-ui,sans-serif;color:#342246">
        <section style="max-width:560px;border:1px solid #eadff4;border-radius:20px;background:white;padding:28px;box-shadow:0 16px 50px #31194b18">
          <h1 style="margin:0 0 10px;color:#6735a8">SoapyFUN no pudo iniciar</h1>
          <p style="line-height:1.6;color:#675f70">Angular encontró un error al montar la aplicación. Consulta la consola del navegador con F12 y busca “SoapyFUN bootstrap error”.</p>
          <button onclick="location.reload()" style="margin-top:12px;border:0;border-radius:10px;background:#6938bd;color:white;padding:11px 16px;font-weight:700;cursor:pointer">Intentar de nuevo</button>
        </section>
      </main>`;
  }
});
