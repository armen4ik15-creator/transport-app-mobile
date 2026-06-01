import { ScreenHeader } from './ScreenHeader';
import { ScreenHero } from './ScreenHero';

interface ListScreenIntroProps {
  headerTitle: string;
  heroTitle: string;
  heroSubtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function ListScreenIntro({
  headerTitle,
  heroTitle,
  heroSubtitle,
  showBack = true,
  onBack,
  actionLabel,
  onAction,
}: ListScreenIntroProps) {
  return (
    <>
      <ScreenHeader
        title={headerTitle}
        showBack={showBack}
        onBack={onBack}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <ScreenHero title={heroTitle} subtitle={heroSubtitle} />
    </>
  );
}
