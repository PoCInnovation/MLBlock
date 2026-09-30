import { useState, useRef } from 'react';
import SiteLayout from '../components/landing/SiteLayout';
import { Card } from '@/components/ui/card';
import { theme } from '../theme';

type TeamMember = {
    name: string;
    role: string;
    tagline: string;
    color: string;
    linkedin?: string;
};

const TEAM: TeamMember[] = [
    {
        name: 'Ilan',
        role: 'Dev',
        tagline:
            "J'aime autant construire que transmettre, MLBlock fait les deux à la fois.",
        color: '#D97757',
        linkedin: 'https://www.linkedin.com/in/ilan-lp/?skipRedirect=true',
    },
    {
        name: 'Chedli',
        role: 'Dev',
        tagline: 'Curieux par nature, je construit des outils qui apprennent.',
        color: '#B6A0E3',
        linkedin:
            'https://www.linkedin.com/in/chedli-ouaziz-9b756a295/?skipRedirect=true',
    },
    {
        name: 'Ali',
        role: 'Dev',
        tagline: 'Passionné par le code et l\'IA, je donne vie aux idées.',
        color: '#7DAFEA',
        linkedin:
            'https://www.linkedin.com/in/ali-bassim-b3956734a/?skipRedirect=true',
    },
    {
        name: 'Sacha',
        role: 'Responsable',
        tagline: 'Coordonner l\'équipe pour livrer un projet qui a du sens.',
        color: theme.color.status,
        linkedin:
            'https://www.linkedin.com/in/sacha-henneveux-084052304/?skipRedirect=true',
    },
];

function TeamCard({ name, role, tagline, linkedin }: TeamMember) {
    const [photoFailed, setPhotoFailed] = useState(false);

    const inner = (
        <div className="flex flex-col gap-2 text-center">
            <div className="mb-1.5 flex justify-center">
                {!photoFailed ? (
                    <img
                        src={`/assets/team/${name.toLowerCase()}.png`}
                        alt={name}
                        loading="lazy"
                        onError={() => setPhotoFailed(true)}
                        className="w-24 h-24 rounded-3xl object-cover block"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-3xl bg-surface3 flex items-center justify-center">
                        <h2 className="text-text text-4xl">{name[0]}</h2>
                    </div>
                )}
            </div>
            <h4 className="font-heading font-bold text-center text-foreground text-lg">{name}</h4>
            <p className="text-xs uppercase tracking-wider text-center text-status font-bold">{role}</p>
            <p className="text-sm text-secondary italic text-center">{tagline}</p>
        </div>
    );

    if (linkedin) {
        return (
            <Card
                className="bg-surface3 border border-white/10 rounded-2xl p-7 block no-underline transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit block">
                {inner}
                </a>
            </Card>
        );
    }
    return <Card className="bg-surface3 border border-white/10 rounded-2xl p-7 block">{inner}</Card>;
}
function PocLogoSlot() {
    const [logoFailed, setLogoFailed] = useState(false);
    if (logoFailed) {
        return <h2 className="text-text-input tracking-wider font-heading text-2xl font-bold">PoC</h2>;
    }
    return (
        <img
            src="/assets/poc-logo.png"
            alt="PoC Innovation"
            onError={() => setLogoFailed(true)}
            className="w-auto block h-12"
        />
    );
}

function PocSection() {
    const textRef = useRef<HTMLDivElement>(null);
    return (
        <div className="max-w-7xl mx-auto px-12 py-16">
            <div className="flex flex-col gap-3">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">Le projet, porté par PoC Innovation</h2>
                <Card className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <PocLogoSlot />
                        <div className="flex flex-col gap-3 flex-1" ref={textRef}>
                            <p className="text-foreground leading-relaxed text-sm sm:text-base">MLBlock est un projet officiel de PoC Innovation, le centre de R&D étudiant d'Epitech. Fondé en 2017, ce centre réunit une quarantaine d'étudiants qui travaillent sur des projets open source autour de l'IA, la sécurité, la santé, l'AR/VR, le hardware et le software, à travers ateliers, bootcamps et hackathons.</p>
                            <div>
                                <a className="poc-btn" href="https://poc-innovation.fr/" target="_blank" rel="noopener noreferrer">Voir le site de PoC Innovation</a>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
export default function AboutPage() {
    return (
        <SiteLayout>
            <div className="max-w-7xl mx-auto px-12 pt-16">
                <div className="flex flex-col gap-3">
                    <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">Qui sommes nous</h1>
                    <h3 className="font-heading text-xl font-bold text-foreground">Pourquoi MLBlock</h3>
                    <p className="text-secondary max-w-2xl text-base">MLBlock existe pour que des élèves comprennent visuellement comment fonctionne un pipeline d'IA, sans écrire de code.</p>
                </div>
            </div>

            <section className="bg-surface border-t border-white/5 mt-14">
                <div className="max-w-7xl mx-auto px-12 py-16">
                    <div className="flex flex-col gap-3">
                        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">L'équipe</h2>
                        <p className="text-secondary text-base">Quatre étudiants Epitech derrière le projet.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {TEAM.map((m) => (
                                <TeamCard key={m.name} {...m} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <PocSection />
        </SiteLayout>
    );
}
