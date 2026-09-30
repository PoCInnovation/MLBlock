import { Link } from '@tanstack/react-router'
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
        color: 'var(--color-accent-light)',
        icon: <div className="w-4.5 h-4.5 rounded-md bg-white/85" />,
        title: 'Comme un jeu de construction',
        desc: "Attrape un bloc, dépose-le dans ton projet. Il s'emboîte tout seul à la bonne place. Aucune ligne à taper.",
    },
    {
        color: 'var(--color-lilac)',
        icon: (
            <div className="flex flex-col gap-1">
                <div className="w-4.5 h-1 rounded-sm bg-white/85" />
                <div className="w-4.5 h-1 rounded-sm bg-white/85" />
                <div className="w-2.5 h-1 rounded-sm bg-white/85" />
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
            className="bg-surface4 border-t border-white/5"
        >
            <div className="landing-section-pad max-w-310 mx-auto px-12 pt-12 pb-18">
                <h2 className="font-heading font-semibold text-4xl tracking-tight mb-2 mt-0">
                    L'intelligence artificielle, en pièces à assembler
                </h2>
                <p className="text-text-muted text-lg font-semibold mb-11 mt-0">
                    Chaque étape de l'apprentissage devient un bloc.
                </p>
                <div className="landing-features-grid grid grid-cols-3 gap-5.5">
                    {FEATURES.map(({ color, icon, title, desc }) => (
                        <div
                            key={title}
                            className="bg-surface3 border border-white/[0.06] rounded-3xl p-7"
                        >
                            <div
                                className="w-11.5 h-11.5 rounded-lg feature-icon-shadow flex items-center justify-center mt-0.5 mb-4"
                                style={{ background: color }}
                            >
                                {icon}
                            </div>
                            <h3 className="font-heading font-semibold text-xl mb-2 mt-0">
                                {title}
                            </h3>
                            <p className="text-text-muted text-sm leading-relaxed font-semibold m-0">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-9">
                    <Link to="/cours" className="poc-btn no-underline" aria-label="Tous les cours">Tous les cours →</Link>
                </div>
            </div>
        </section>
    );
}
