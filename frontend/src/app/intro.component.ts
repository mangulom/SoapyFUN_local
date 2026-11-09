import { Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'soapy-intro',
  standalone: true,
  template: `
    @if (visible()) {
        <main class="intro-screen" role="status" aria-label="Cargando SoapyFUN">
        <div class="intro-pattern" aria-hidden="true"></div>
        <section class="intro-content">
          <img class="intro-logo" src="/icon.svg" alt="Icono SoapyFUN" width="96" height="96" />
          <h1>@for (letter of letters; track $index) {<span [class.fun-letter]="letter.fun" [style.animation-delay]="letter.delay + 's'">{{ letter.char }}</span>}</h1>
          <p class="intro-subtitle">Gesti&oacute;n de productos artesanales inteligente</p>
          <p class="intro-features">Fórmulas <i>|</i> Costos <i>|</i> Insumos <i>|</i> Clientes</p>
          <div class="intro-track"><div class="intro-progress"></div></div>
        </section>
      </main>
    }
  `,
  styles: [`
    .intro-screen{position:fixed;inset:0;z-index:100;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#1e1b4b,#3b0764 52%,#020617);color:white}
    .intro-pattern{position:absolute;inset:0;opacity:.1;background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");}
    .intro-content{position:relative;display:flex;flex-direction:column;align-items:center;animation:fade-in .8s ease-out both}.intro-logo{display:block;width:96px;height:96px;margin-bottom:23px;border:1px solid #ffffff38;border-radius:27px;object-fit:cover;box-shadow:0 18px 45px #160b2d99}
    h1{margin:0;font-size:clamp(38px,8vw,54px);font-weight:800;letter-spacing:-2px}h1 span{display:inline-block;opacity:0;animation:letter-drop .8s cubic-bezier(.22,1,.36,1) forwards}h1 span.fun-letter{color:#fde047}
    .intro-subtitle{margin:12px 0 0;color:#e6d8fa;font-size:12px;letter-spacing:.25em;text-transform:uppercase}.intro-features{margin:8px 0 0;color:#c5b2e5;font-size:11px}.intro-features i{padding:0 5px;color:#facc15;font-style:normal}
    .intro-track{width:190px;height:4px;margin-top:37px;overflow:hidden;border-radius:4px;background:#ffffff22}.intro-progress{height:100%;border-radius:4px;background:#facc15;animation:progress 3s linear forwards}
    @keyframes fade-in{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}@keyframes progress{to{width:100%}}@keyframes letter-drop{0%{transform:translateY(-60vh);opacity:0}55%{transform:translateY(7px);opacity:1}75%{transform:translateY(-3px)}to{transform:translateY(0);opacity:1}}
    @media(prefers-reduced-motion:reduce){.intro-content,h1 span,.intro-progress{animation-duration:.01ms;animation-iteration-count:1}h1 span{opacity:1}}
  `],
})
export class IntroComponent implements OnInit {
  readonly visible = signal(false);
  readonly letters = 'SoapyFUN'.split('').map((char,index)=>({char,fun:index>=5,delay:index*.09}));
  ngOnInit(): void { this.visible.set(true); window.setTimeout(() => this.visible.set(false), 3000); }
}
