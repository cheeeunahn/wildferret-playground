import { CONTACT_EMAIL, EFFECTIVE_DATE, OPERATOR, SECTIONS } from './domain/privacy';
import './fonts.css';
import styles from './PrivacyPage.module.css';

// The privacy policy, at /otaku-diary/privacy. The text lives in
// domain/privacy.js.
export default function PrivacyPage() {
  return (
    <div className={styles.backdrop}>
      <main className={styles.page}>
        <a className={styles.back} href="/otaku-diary">
          ← 애니와 함께하는 바다모험
        </a>
        <h1 className={styles.title}>개인정보 처리방침</h1>
        <p className={styles.lead}>
          ‘애니와 함께하는 바다모험’이 어떤 정보를 왜 다루고, 어떻게 지울 수 있는지 설명합니다.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.intro && <p>{section.intro}</p>}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.outro && <p>{section.outro}</p>}
          </section>
        ))}

        <section className={styles.section}>
          <h2>{SECTIONS.length + 1}. 개인정보 보호책임자와 문의처</h2>
          <p>
            개인정보 보호책임자: 운영자 {OPERATOR}
            <br />
            이메일: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>

        <p className={styles.date}>시행일: {EFFECTIVE_DATE}</p>
      </main>
    </div>
  );
}
