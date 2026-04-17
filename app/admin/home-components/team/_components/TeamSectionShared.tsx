'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { TeamColorTokens } from '../_lib/colors';
import type {
  TeamBrandMode,
  TeamEditorMember,
  TeamMember,
  TeamStyle,
} from '../_types';

type TeamSharedContext = 'preview' | 'site';

type TeamSocialPlatform = 'facebook' | 'linkedin' | 'twitter' | 'email';

interface TeamSectionSharedProps {
  members: Array<TeamMember | TeamEditorMember>;
  style: TeamStyle;
  title: string;
  tokens: TeamColorTokens;
  mode: TeamBrandMode;
  context: TeamSharedContext;
  device?: PreviewDevice;
  carouselId?: string;
  texts?: Record<string, string>;
}

interface NormalizedTeamMember {
  key: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  email: string;
}

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const toMemberRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }

  return {};
};

const buildMemberKey = (raw: Record<string, unknown>, member: Omit<NormalizedTeamMember, 'key'>, index: number) => {
  const idCandidate = raw.id ?? raw.key;

  if (typeof idCandidate === 'string' && idCandidate.trim().length > 0) {
    return `id:${idCandidate.trim()}`;
  }

  if (typeof idCandidate === 'number' && Number.isFinite(idCandidate)) {
    return `id:${idCandidate}`;
  }

  const contentKey = `${member.name.trim()}|${member.role.trim()}|${member.email.trim()}`;
  if (contentKey.replaceAll('|', '').length > 0) {
    return `content:${contentKey}`;
  }

  return `idx:${index}`;
};

const normalizeMembers = (input: Array<TeamMember | TeamEditorMember>): NormalizedTeamMember[] => {
  const duplicates = new Map<string, number>();

  return input.map((rawInput, index) => {
    const raw = toMemberRecord(rawInput);
    const member = {
      name: toText(raw.name),
      role: toText(raw.role),
      avatar: toText(raw.avatar),
      bio: toText(raw.bio),
      facebook: toText(raw.facebook),
      linkedin: toText(raw.linkedin),
      twitter: toText(raw.twitter),
      email: toText(raw.email),
    };

    const baseKey = buildMemberKey(raw, member, index);
    const count = duplicates.get(baseKey) ?? 0;
    duplicates.set(baseKey, count + 1);

    return {
      key: count === 0 ? baseKey : `${baseKey}::${count}`,
      ...member,
    };
  });
};

const getInitial = (name: string) => {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'U';
};

const getSocialHref = (platform: TeamSocialPlatform, rawValue: string) => {
  const value = rawValue.trim();
  if (!value) {return null;}

  if (platform === 'email') {
    if (!value.includes('@')) {return null;}
    return `mailto:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(value)) {
    return `https://${value}`;
  }

  return null;
};

const renderSocialIcon = (platform: TeamSocialPlatform, size: number) => {
  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="shrink-0" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" className="shrink-0" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
      </svg>
    );
  }

  if (platform === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" className="shrink-0" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="shrink-0" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
};

const TeamSocialButton = ({
  platform,
  value,
  context,
  tokens,
  sizeClass = 'w-8 h-8',
  iconSize = 14,
}: {
  platform: TeamSocialPlatform;
  value: string;
  context: TeamSharedContext;
  tokens: TeamColorTokens;
  sizeClass?: string;
  iconSize?: number;
}) => {
  const href = getSocialHref(platform, value);

  if (!href) {
    return null;
  }

  const icon = renderSocialIcon(platform, iconSize);
  const className = cn('inline-flex items-center justify-center rounded-full border transition-transform hover:scale-105', sizeClass);
  const style: React.CSSProperties = {
    backgroundColor: tokens.socialButtonBg,
    borderColor: tokens.socialButtonBorder,
    color: tokens.socialButtonIcon,
  };

  if (context === 'site') {
    const isMail = href.startsWith('mailto:');

    return (
      <a
        href={href}
        className={className}
        style={style}
        target={isMail ? undefined : '_blank'}
        rel={isMail ? undefined : 'noopener noreferrer'}
        aria-label={platform}
      >
        {icon}
      </a>
    );
  }

  return (
    <span className={className} style={style} aria-label={platform}>
      {icon}
    </span>
  );
};

const TeamAvatar = ({
  member,
  tokens,
  context,
  className,
  sizes,
}: {
  member: NormalizedTeamMember;
  tokens: TeamColorTokens;
  context: TeamSharedContext;
  className: string;
  sizes: string;
}) => {
  if (member.avatar.trim().length > 0) {
    return (
      <Image
        src={member.avatar}
        alt={member.name || 'Team member'}
        fill
        sizes={sizes}
        className={className}
        unoptimized={context === 'preview'}
        draggable={false}
      />
    );
  }

  return (
    <div
      className="h-full w-full flex items-center justify-center text-3xl font-bold"
      style={{
        backgroundColor: tokens.avatarFallbackBg,
        color: tokens.avatarFallbackText,
      }}
    >
      {getInitial(member.name)}
    </div>
  );
};

const getPreviewLimit = (style: TeamStyle, device: PreviewDevice) => {
  if (style === 'carousel') {
    if (device === 'mobile') {return 5;}
    if (device === 'tablet') {return 6;}
    return 8;
  }

  if (style === 'bento') {
    if (device === 'mobile') {return 6;}
    if (device === 'tablet') {return 8;}
    return 9;
  }

  if (device === 'mobile') {return 4;}
  if (device === 'tablet') {return 6;}
  return 8;
};

export function TeamSectionShared({
  members,
  style,
  title,
  tokens,
  mode,
  context,
  device = 'desktop',
  carouselId,
  texts = {},
}: TeamSectionSharedProps) {
  const isPreview = context === 'preview';
  const isMobilePreview = isPreview && device === 'mobile';
  const isTabletPreview = isPreview && device === 'tablet';
  const heading = title.trim() || 'Đội ngũ của chúng tôi';
  const subtitle = texts.subtitle || 'Đội ngũ chuyên nghiệp';
  const emptyMessage = texts.emptyMessage || 'Chưa có thành viên nào.';

  const normalizedMembers = React.useMemo(() => normalizeMembers(members), [members]);

  const visibleMembers = React.useMemo(() => {
    if (!isPreview) {
      return normalizedMembers;
    }

    return normalizedMembers.slice(0, getPreviewLimit(style, device));
  }, [normalizedMembers, isPreview, style, device]);

  const carouselIdSeed = React.useId().replaceAll(':', '');

  const basePadding = isPreview
    ? cn('py-7 md:py-8', isMobilePreview ? 'px-3' : 'px-4 md:px-6')
    : 'py-12 md:py-16 px-4 md:px-6';

  const header = (
    <div className={cn('mx-auto mb-6', style === 'timeline' ? 'max-w-5xl' : 'max-w-7xl')}>
      <div className="text-center space-y-2">
        <h2
          className={cn(
            'font-bold tracking-tight',
            isPreview ? (isMobilePreview ? 'text-xl' : 'text-2xl') : 'text-3xl md:text-4xl',
          )}
          style={{ color: tokens.heading }}
        >
          {heading}
        </h2>
        {subtitle ? (
          <p className="text-sm" style={{ color: tokens.sectionSubtitle }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (visibleMembers.length === 0) {
    return (
      <section className={basePadding} data-mode={mode}>
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
            }}
          >
            <Users className="mx-auto mb-3" size={40} style={{ color: tokens.sectionAccent }} />
            <h3 className="text-xl font-semibold" style={{ color: tokens.heading }}>{heading}</h3>
            <p className="mt-1 text-sm" style={{ color: tokens.mutedText }}>{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  const renderGrid = () => {
    const columns = isPreview
      ? (isMobilePreview ? 'grid-cols-2' : (isTabletPreview ? 'grid-cols-3' : 'grid-cols-4'))
      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

    return (
      <section className={basePadding} data-mode={mode}>
        {header}
        <div className={cn('max-w-7xl mx-auto grid gap-4 md:gap-6', columns)}>
          {visibleMembers.map((member) => (
            <article key={member.key} className="group text-center">
              <div
                className="relative mb-3 overflow-hidden rounded-2xl border aspect-square"
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                }}
              >
                <TeamAvatar
                  member={member}
                  tokens={tokens}
                  context={context}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 768px) 50vw, 240px"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 pb-3 pt-8 bg-gradient-to-t from-slate-900/80 to-transparent">
                  <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} />
                  <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} />
                  <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} />
                  <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} />
                </div>
              </div>
              <h3 className="font-semibold line-clamp-1" style={{ color: tokens.neutralText }}>{member.name || 'Thành viên'}</h3>
              <p className="text-sm mt-0.5 line-clamp-1" style={{ color: tokens.styleAccentByStyle.grid }}>{member.role || 'Chức vụ'}</p>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderCards = () => {
    const columns = isPreview
      ? (isMobilePreview ? 'grid-cols-1' : (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3'))
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

    return (
      <section className={cn(basePadding, 'bg-slate-50/60')} data-mode={mode}>
        {header}
        <div className={cn('max-w-7xl mx-auto grid gap-4 md:gap-5', columns)}>
          {visibleMembers.map((member) => (
            <article
              key={member.key}
              className="rounded-2xl border p-4 md:p-5 h-full"
              style={{
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
              }}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-xl border" style={{ borderColor: tokens.cardBorder }}>
                  <TeamAvatar
                    member={member}
                    tokens={tokens}
                    context={context}
                    className="h-full w-full object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-1" style={{ color: tokens.neutralText }}>{member.name || 'Thành viên'}</h3>
                  <p className="text-sm line-clamp-1" style={{ color: tokens.styleAccentByStyle.cards }}>{member.role || 'Chức vụ'}</p>
                  {member.bio ? (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: tokens.mutedText }}>{member.bio}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderCarousel = () => {
    const elementId = carouselId ?? `team-carousel-${carouselIdSeed}`;
    const cardWidth = isPreview
      ? (isMobilePreview ? 272 : (isTabletPreview ? 284 : 300))
      : 312;

    const scrollByCard = (direction: -1 | 1) => {
      const el = document.getElementById(elementId);
      if (!el) {return;}
      el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
    };

    return (
      <section className={basePadding} data-mode={mode}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2
                className={cn(
                  'font-bold tracking-tight',
                  isPreview ? (isMobilePreview ? 'text-xl' : 'text-2xl') : 'text-3xl',
                )}
                style={{ color: tokens.heading }}
              >
                {heading}
              </h2>
              <p className="text-sm mt-1" style={{ color: tokens.sectionSubtitle }}>Kéo ngang để xem thêm thành viên</p>
            </div>
            {visibleMembers.length > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { scrollByCard(-1); }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: tokens.carouselNavBg,
                    borderColor: tokens.carouselNavBorder,
                    color: tokens.carouselNavIcon,
                  }}
                  aria-label="Cuộn trái"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { scrollByCard(1); }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: tokens.carouselNavBg,
                    borderColor: tokens.carouselNavBorder,
                    color: tokens.carouselNavIcon,
                  }}
                  aria-label="Cuộn phải"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-2xl">
            <div
              id={elementId}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-1 px-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {visibleMembers.map((member) => (
                <article
                  key={member.key}
                  className="snap-start shrink-0 rounded-2xl border overflow-hidden"
                  style={{
                    width: cardWidth,
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                    borderBottomColor: tokens.styleAccentByStyle.carousel,
                    borderBottomWidth: 3,
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <TeamAvatar
                      member={member}
                      tokens={tokens}
                      context={context}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 90vw, 312px"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1" style={{ color: tokens.neutralText }}>{member.name || 'Thành viên'}</h3>
                    <p className="text-sm mt-0.5 line-clamp-1" style={{ color: tokens.roleText }}>{member.role || 'Chức vụ'}</p>
                    {member.bio ? (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: tokens.mutedText }}>{member.bio}</p>
                    ) : null}
                    <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: tokens.cardBorder }}>
                      <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                      <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                      <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                      <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  // const renderBento = () => {
  //   const columns = isPreview
  //     ? (isMobilePreview ? 'grid-cols-2' : (isTabletPreview ? 'grid-cols-3' : 'grid-cols-4'))
  //     : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  //   return (
  //     <section className={basePadding} data-mode={mode}>
  //       {header}
  //       <div className={cn('max-w-7xl mx-auto grid gap-x-6 gap-y-20 text-center mt-24', columns)}>
  //         {visibleMembers.map((member) => (
  //           <article key={member.key}>
  //             <div
  //               className="bg-gray-200 relative rounded-sm"
  //               style={{
  //                 backgroundColor: tokens.cardBackground,
  //               }}
  //             >
  //               <div className="w-32 h-32 rounded-full inline-block border border-gray-200 bg-gray-100 -mt-14 overflow-hidden">
  //                 <div className="w-full h-full overflow-hidden rounded-full">
  //                   <TeamAvatar
  //                     member={member}
  //                     tokens={tokens}
  //                     context={context}
  //                     className="w-full h-full object-cover"
  //                     sizes="128px"
  //                   />
  //                 </div>
  //               </div>

  //               <div className="py-4">
  //                 <h4 className="text-base font-semibold" style={{ color: tokens.neutralText }}>
  //                   {member.name || 'Thành viên'}
  //                 </h4>
  //                 <p className="text-[13px] mt-1" style={{ color: tokens.styleAccentByStyle.bento }}>
  //                   {member.role || 'Chức vụ'}
  //                 </p>

  //                 <div className="flex items-center justify-center gap-4 mt-4">
  //                   <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
  //                   <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
  //                   <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
  //                   <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
  //                 </div>
  //               </div>
  //             </div>
  //           </article>
  //         ))}
  //       </div>
  //     </section>
  //   );
  // };

    const renderBento = () => {
    const columns = isPreview
      ? isMobilePreview
        ? 'grid-cols-2'
        : isTabletPreview
          ? 'grid-cols-3'
          : 'grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

    return (
      <section className={basePadding} data-mode={mode}>
        {header}

        {/* giống mẫu: grid gap lớn, text center, container max */}
        <div
          className={cn(
            'grid gap-8 text-center mt-16 max-w-5xl max-lg:max-w-3xl max-md:max-w-xl mx-auto',
            columns,
          )}
        >
          {visibleMembers.map((member) => (
            <article key={member.key} className="group">
              {/* avatar tròn */}
              <div
                className="w-32 h-32 rounded-full overflow-hidden inline-block"
                style={{ backgroundColor: tokens.avatarFallbackBg }}
              >
                <div className="relative w-full h-full">
                  <TeamAvatar
                    member={member}
                    tokens={tokens}
                    context={context}
                    className="h-full w-full object-cover"
                    sizes="128px"
                  />
                </div>
              </div>

              {/* text block */}
              <div className="py-4">
                <h4
                  className="text-base font-semibold"
                  style={{ color: tokens.neutralText }}
                >
                  {member.name || 'Thành viên'}
                </h4>

                <p
                  className="text-[13px] mt-1.5"
                  style={{ color: tokens.styleAccentByStyle.bento }}
                >
                  {member.role || 'Chức vụ'}
                </p>

                {member.bio ? (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: tokens.mutedText }}>{member.bio}</p>
                ) : null}

                {/* socials (optional): giữ giống component của bạn */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <TeamSocialButton
                    platform="facebook"
                    value={member.facebook}
                    context={context}
                    tokens={tokens}
                    sizeClass="w-7 h-7"
                    iconSize={12}
                  />
                  <TeamSocialButton
                    platform="linkedin"
                    value={member.linkedin}
                    context={context}
                    tokens={tokens}
                    sizeClass="w-7 h-7"
                    iconSize={12}
                  />
                  <TeamSocialButton
                    platform="twitter"
                    value={member.twitter}
                    context={context}
                    tokens={tokens}
                    sizeClass="w-7 h-7"
                    iconSize={12}
                  />
                  <TeamSocialButton
                    platform="email"
                    value={member.email}
                    context={context}
                    tokens={tokens}
                    sizeClass="w-7 h-7"
                    iconSize={12}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderTimeline = () => {
    const shouldAlternate = !isPreview || device === 'desktop';

    return (
      <section className={basePadding} data-mode={mode}>
        {header}
        <div className="max-w-5xl mx-auto relative">
          <div
            className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5"
            style={{ backgroundColor: tokens.timelineLine }}
          />

          <div className="space-y-6 md:space-y-8">
            {visibleMembers.map((member, index) => {
              const reverse = shouldAlternate && index % 2 === 1;

              return (
                <div key={member.key} className={cn('relative md:flex md:items-center', reverse ? 'md:flex-row-reverse' : 'md:flex-row')}>
                  <div
                    className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4"
                    style={{
                      backgroundColor: tokens.timelineDotBg,
                      borderColor: tokens.timelineDotRing,
                    }}
                  />

                  <div className={cn('ml-10 md:ml-0 md:w-5/12', reverse ? 'md:pl-10' : 'md:pr-10')}>
                    <article
                      className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: tokens.cardBackground,
                        borderColor: tokens.cardBorder,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden border" style={{ borderColor: tokens.cardBorder }}>
                          <TeamAvatar
                            member={member}
                            tokens={tokens}
                            context={context}
                            className="h-full w-full object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1" style={{ color: tokens.neutralText }}>{member.name || 'Thành viên'}</h3>
                          <p className="text-sm line-clamp-1" style={{ color: tokens.styleAccentByStyle.timeline }}>{member.role || 'Chức vụ'}</p>
                          {member.bio ? (
                            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: tokens.mutedText }}>{member.bio}</p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2">
                            <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                            <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                            <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                            <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} sizeClass="w-7 h-7" iconSize={12} />
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="hidden md:block md:w-5/12" />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderSpotlight = () => {
    const columns = isPreview
      ? (isMobilePreview ? 'grid-cols-1' : (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3'))
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
      <section className={basePadding} data-mode={mode} style={{ background: tokens.spotlightSectionBg }}>
        {header}
        <div className={cn('max-w-7xl mx-auto grid gap-5 md:gap-6', columns)}>
          {visibleMembers.map((member) => (
            <article key={member.key} className="group relative">
              <div
                className="relative rounded-2xl border-2 p-5 transition-colors duration-200"
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                }}
              >
                <div className="relative mx-auto mb-4 h-24 w-24 rounded-full p-[2px]" style={{ borderColor: tokens.spotlightRing, borderWidth: '2px', borderStyle: 'solid' }}>
                  <div className="relative h-full w-full rounded-full overflow-hidden bg-white">
                    <TeamAvatar
                      member={member}
                      tokens={tokens}
                      context={context}
                      className="h-full w-full object-cover"
                      sizes="96px"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold" style={{ color: tokens.neutralText }}>{member.name || 'Thành viên'}</h3>
                  <p className="text-sm mt-0.5" style={{ color: tokens.styleAccentByStyle.spotlight }}>{member.role || 'Chức vụ'}</p>
                  {member.bio ? (
                    <p className="text-xs mt-2 line-clamp-3" style={{ color: tokens.mutedText }}>{member.bio}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <TeamSocialButton platform="facebook" value={member.facebook} context={context} tokens={tokens} />
                    <TeamSocialButton platform="linkedin" value={member.linkedin} context={context} tokens={tokens} />
                    <TeamSocialButton platform="twitter" value={member.twitter} context={context} tokens={tokens} />
                    <TeamSocialButton platform="email" value={member.email} context={context} tokens={tokens} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  switch (style) {
    case 'grid': {
      return renderGrid();
    }
    case 'cards': {
      return renderCards();
    }
    case 'carousel': {
      return renderCarousel();
    }
    case 'bento': {
      return renderBento();
    }
    case 'timeline': {
      return renderTimeline();
    }
    case 'spotlight':
    default: {
      return renderSpotlight();
    }
  }
}

