import { Link } from '@tanstack/react-router'
import { theme } from '../../theme'
import { Play } from 'lucide-react'
import React from 'react'

type Feature = {
    color: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
};

const FEATURES: Feature[] = [
    {
        color: theme.color.accentLight,
        icon: (
            <div
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,.85)',
                }}
            />
        ),
        title: 'Comme un jeu de construction',
        desc: "Attrape un bloc, dépose-le dans ton projet. Il s'emboîte tout seul à la bonne place. Aucune ligne à taper.",
    },
    {
        color: 'var(--color-lilac)',
        icon: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div
                    style={{
                        width: 18,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,.85)',
                    }}
                />
                <div
                    style={{
                        width: 18,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,.85)',
                    }}
                />
                <div
                    style={{
                        width: 11,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,.85)',
                    }}
                />
            </div>
        ),
        title: 'Images, textes, tableaux',
        desc: 'Images, textes, tableaux de chiffres : reconnais, classe et prédis avec des modèles simples ou de vrais réseaux de neurones.',
    },
    {
        color: 'var(--color-sky)',
        icon: <Play size={14} color="#fff" />,
        title: 'Vois-le apprendre',
        desc: 'Appuie sur Lancer et regarde, tour après tour, ton modèle se tromper de moins en moins et devenir de plus en plus précis.',
    },
];

export default function FeaturesSection() {
    return (
        <section
            id="fonctionnalites"
            style={{
                background: '#1f1916',
                borderTop: '1px solid rgba(255,255,255,.05)',
            }}
        >
            <div
                className="landing-section-pad"
                style={{
                    maxWidth: 1240,
                    margin: '0 auto',
                    padding: '48px 48px 72px',
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                        fontSize: 34,
                        letterSpacing: '-.01em',
                        margin: '0 0 8px',
                    }}
                >
                    L'intelligence artificielle, en pièces à assembler
                </h2>
                <p
                    style={{
                        color: '#b7ada3',
                        fontSize: 17,
                        fontWeight: 600,
                        margin: '0 0 44px',
                    }}
                >
                    Chaque étape de l'apprentissage devient un bloc.
                </p>
                <div
                    className="landing-features-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 22,
                    }}
                >
                    {FEATURES.map(({ color, icon, title, desc }) => (
                        <div
                            key={title}
                            style={{
                                background: '#251e1a',
                                border: '1px solid rgba(255,255,255,.06)',
                                borderRadius: 24,
                                padding: 28,
                            }}
                        >
                            <div
                                style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 14,
                                    background: color,
                                    boxShadow: '0 3px 0 rgba(0,0,0,.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 2,
                                    marginBottom: 16,
                                }}
                            >
                                {icon}
                            </div>
                            <h3
                                style={{
                                    fontFamily: "'Fredoka', sans-serif",
                                    fontWeight: 600,
                                    fontSize: 21,
                                    margin: '0 0 8px',
                                }}
                            >
                                {title}
                            </h3>
                            <p
                                style={{
                                    color: theme.color.textMuted,
                                    fontSize: 15,
                                    lineHeight: 1.55,
                                    fontWeight: 600,
                                    margin: 0,
                                }}
                            >
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                    <Link to="/cours" className="poc-btn" style={{ textDecoration: 'none' }} aria-label="Tous les cours">Tous les cours →</Link>
                </div>
            </div>
        </section>
    );
}
