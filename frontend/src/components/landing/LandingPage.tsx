import { useLocation, useNavigate } from 'react-router-dom';
import { Nav } from './Nav';
import { Hero } from './Hero';
import { Overview } from './Overview';
import { Unified } from './Unified';
import { LinkGoal } from './LinkGoal';
import { Capabilities } from './Capabilities';
import { Kpis } from './Kpis';
import { Hosting } from './Hosting';
import { PlatformValue } from './PlatformValue';
import { DemoCta } from './DemoCta';
import { SiteFooter } from './SiteFooter';
import { DemoRequestPage } from './DemoRequestPage';
import './landing-tailwind.css';
import './landing.css';
import './landing-sections.css';

/**
 * Composes the original track-plus-project landing sections unchanged.
 * The "تسجيل الدخول" (login) buttons inside Nav/Footer are inert here —
 * there is no login page in this standalone bundle, so no routing is
 * attached to them. The same click-delegation still catches any "اطلب عرض
 * تجريبي" (request a demo) button anywhere on the page and swaps in the
 * DemoRequestPage form.
 */
export function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const showDemoRequest = location.pathname === '/request-demo';

  return (
    <div
      className="tp-landing bg-background"
      dir="rtl"
      onClickCapture={(e) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button) return;
        const label =
          button.getAttribute('aria-label') ??
          button.querySelector('img')?.getAttribute('alt') ??
          button.textContent ??
          '';
        if (label.includes('اطلب عرض تجريبي')) {
          navigate('/request-demo');
        }
      }}
    >
      {showDemoRequest ? (
        <DemoRequestPage onSubmitted={() => navigate('/', { replace: true })} />
      ) : (
        <>
          <Nav />
          <Hero />
          <div className="landing-flow">
            <Overview />
            <Unified />
            <LinkGoal />
            <Capabilities />
            <Kpis />
            <Hosting />
            <PlatformValue />
            <DemoCta />
          </div>
          <SiteFooter />
        </>
      )}
    </div>
  );
}
