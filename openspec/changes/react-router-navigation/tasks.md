## 1. Setup React Router

- [x] 1.1 Installer `react-router-dom` dans `frontend/package.json`
- [x] 1.2 Wrapper `<BrowserRouter>` dans `main.tsx`
- [x] 1.3 Réécrire `App.tsx` : `switch screen` → `<Routes>` (6 routes + `/editor` protégée)

## 2. Store

- [x] 2.1 Supprimer `screen` et les 6 `go*()` du store Zustand

## 3. Migration des composants

- [x] 3.1 Migrer `HomeNav.tsx` (goBuild/goHome/goLogin/goHowItWorks/goAbout → navigate)
- [x] 3.2 Migrer `HeroSection.tsx` (goBuild → navigate('/editor'))
- [x] 3.3 Migrer `EditorHeader.tsx` (goHome → navigate('/') + logout)
- [x] 3.4 Migrer `LoginPage.tsx` (goBuild → navigate('/editor'), goRegister → navigate('/register'))
- [x] 3.5 Migrer `RegisterPage.tsx` (goLogin → navigate('/login'))
- [x] 3.6 Migrer `HowItWorksPage.tsx` (goBuild → navigate('/editor'))
- [x] 3.7 Migrer `EditorUnavailableModal.tsx` (goHome → navigate('/'))

## 4. Vérification

- [x] 4.1 Build frontend réussi
- [x] 4.2 Grep `goBuild|goHome|goLogin|goRegister|goHowItWorks|goAbout` → 0 résultat
- [ ] 4.3 Tester refresh sur `/editor` → page restaurée
