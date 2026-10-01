import React from 'react';
import { ArrowUpRight, ArrowDown, Monitor, Users, Play, Eye, MessageCircle, PersonStanding, Volume2, Check, Zap } from 'lucide-react';
import { sound } from './AudioEngine';

export default function Welcome({ lang, onNavigate }: { lang: 'ar' | 'en'; onNavigate: (view: 'host' | 'join' | 'projector') => void }) {
  const ar = lang === 'ar';
  const roles = [
    { icon: Eye, number: '01', title: ar ? 'المراقب' : 'Observer', text: ar ? 'يشوف المهمة السرية، ويبدأ سلسلة التواصل.' : 'Sees the secret mission and starts the chain.' },
    { icon: MessageCircle, number: '02', title: ar ? 'المتحدث' : 'Messenger', text: ar ? 'يوصل الفكرة، ويوجّه زميله لتنفيذها.' : 'Passes on the idea and guides their teammate.' },
    { icon: PersonStanding, number: '03', title: ar ? 'المنفّذ' : 'Performer', text: ar ? 'يحوّل التعليمات إلى حركة. هنا يبدأ التحدي!' : 'Turns the instructions into action. Challenge on!' }
  ];
  return <>
    <section className="mission-hero">
      <div className="mission-hero-copy">
        <span className="mission-eyebrow"><span className="mission-small-dot"/>{ar ? 'لعبة تواصل • منافسة • ضحك' : 'COMMUNICATION • COMPETITION • GOOD TIMES'}</span>
        <h1>{ar ? <>الفكرة عندك.<br/>التنفيذ <span>عند فريقك.</span></> : <>Your idea.<br/><span>Your team’s move.</span></>}</h1>
        <p>{ar ? 'تحدّي فريقك بمهمة سرية، وأدوار مختلفة، ووقت محدود. شوفوا كيف التواصل يصنع الفرق — وخلي الصف كله يدخل جوّ اللعبة.' : 'A secret mission. Three different roles. One ticking clock. Find out what your team can do when communication becomes the challenge.'}</p>
        <div className="mission-hero-actions"><button className="mission-button primary" onClick={()=>onNavigate('host')}>{ar ? 'ابدأ تحدّي جديد' : 'Start a challenge'}<ArrowUpRight size={20}/></button><button className="mission-button secondary" onClick={()=>onNavigate('join')}><Users size={19}/>{ar ? 'انضم لفريقك' : 'Join your team'}</button></div>
        <div className="mission-hero-meta"><span><Check size={15}/>{ar ? 'فريقان · ٦ لاعبين' : '2 teams · 6 players'}</span><span><Check size={15}/>{ar ? 'عربي وإنجليزي' : 'Arabic & English'}</span><span><Check size={15}/>{ar ? 'من أي جهاز' : 'Any device'}</span></div>
      </div>
      <div className="mission-visual" aria-label={ar ? 'توضيح رحلة المهمة بين أفراد الفريق' : 'Illustration of a mission moving through the team'}>
        <div className="mission-visual-top"><span><span className="mission-small-dot"/>{ar ? 'التحدّي يبدأ بالتواصل' : 'IT STARTS WITH CONNECTION'}</span><span dir="ltr">ROUND / 01</span></div>
        <div className="mission-target" aria-hidden="true"><div/><div/><div/><Zap className="mission-target-zap" size={46} fill="currentColor"/></div>
        <div className="mission-secret"><span className="mission-secret-icon"><Eye size={21}/></span><div><small>{ar ? 'المهمة السرية' : 'THE SECRET MISSION'}</small><strong>{ar ? 'الفكرة تبدأ من هنا' : 'The idea starts here'}</strong></div><span className="mission-secret-tag" dir="ltr">GO!</span></div>
        <div className="mission-visual-flow" aria-hidden="true"><span><Eye size={25}/></span><i/><span><MessageCircle size={25}/></span><i/><span><PersonStanding size={27}/></span></div>
        <div className="mission-visual-bottom"><span>{ar ? 'فكرة → تواصل → حركة' : 'IDEA → CONNECTION → ACTION'}</span><span className="mission-play-chip"><Play size={12} fill="currentColor"/>{ar ? 'دورك تصنع الفرق' : 'MAKE YOUR MOVE'}</span></div>
      </div>
    </section>
    <div className="mission-intro-strip"><span>{ar ? 'منافسة تجمع الكل' : 'A little competition. A lot of connection.'}</span><span dir="ltr">THINK. CONNECT. GO.</span><a href="#how-it-works">{ar ? 'كيف نلعب؟' : 'How it works'}<ArrowDown size={16}/></a></div>
    <section className="mission-roles" id="how-it-works">
      <div className="mission-section-heading"><div><span className="mission-eyebrow">{ar ? 'كل دور له تأثير' : 'EVERY ROLE COUNTS'}</span><h2>{ar ? 'ثلاثة أدوار. مهمة واحدة.' : 'Three roles. One mission.'}</h2></div><p>{ar ? 'الفوز يحتاج فريق يفهم بعض. اختاروا أدواركم، وخلّوا الباقي للتواصل.' : 'Winning takes a team that understands each other. Pick your roles and let the connection do the rest.'}</p></div>
      <div className="mission-role-grid">{roles.map(({icon: Icon, ...role})=><article className="mission-role-card" key={role.number}><div className="mission-role-card-top"><span className="mission-role-icon"><Icon size={25}/></span><span className="mission-role-number">{role.number}</span></div><h3>{role.title}</h3><p>{role.text}</p></article>)}</div>
    </section>
    <section className="mission-entry-section"><div className="mission-section-heading"><div><span className="mission-eyebrow">{ar ? 'مساحة لكل شخص' : 'A SPACE FOR EVERYONE'}</span><h2>{ar ? 'من وين تبدأ؟' : 'Where do you come in?'}</h2></div></div><div className="mission-entry-grid">
      {[{view:'host' as const,icon:Monitor,title:ar?'أنا المعلم':'I’m the host',text:ar?'جهّز الجولة، اختار الصعوبة، وتابع نقاط الفريقين.':'Set up a round, choose the difficulty and keep score.',action:ar?'افتح لوحة المعلم':'Open host dashboard'}, {view:'join' as const,icon:Users,title:ar?'أنا من الفريق':'I’m a player',text:ar?'اختار فريقك ودورك، واستعد للمهمة اللي تجمعكم.':'Choose your team and your role. Your mission awaits.',action:ar?'احجز دورك':'Choose your role'}, {view:'projector' as const,icon:Play,title:ar?'خلّونا نشوف التحدّي':'Bring it to the big screen',text:ar?'اعرض الوقت والنتائج، وخلي الكل يعيش المنافسة.':'Put the timer and scores where everyone can see them.',action:ar?'افتح شاشة العرض':'Open class display'}].map(({icon:Icon,...item})=><button className="mission-entry-card" key={item.view} onClick={()=>onNavigate(item.view)}><Icon size={25}/><h3>{item.title}</h3><p>{item.text}</p><span>{item.action}<ArrowUpRight size={18}/></span></button>)}
    </div></section>
    <section className="mission-sound-bar"><div><Volume2 size={22}/><span><strong>{ar ? 'للتحدّي صوت كمان.' : 'Every challenge has a soundtrack.'}</strong><small>{ar ? 'جرّب مؤثرات اللعبة قبل البداية.' : 'Try the game sounds before you begin.'}</small></span></div><div className="mission-sound-buttons"><button onClick={()=>sound.playClick()}>{ar ? 'نقرة' : 'Tap'}</button><button onClick={()=>sound.playSuccess()}>{ar ? 'فوز' : 'Win'}</button><button onClick={()=>sound.playError()}>{ar ? 'محاولة ثانية' : 'Try again'}</button></div></section>
  </>;
}
