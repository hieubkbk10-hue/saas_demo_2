'use client';

import React from 'react';
import { Play, Video as VideoIcon } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import type { VideoColorTokens } from '../_lib/colors';
import { getVideoInfo, getYouTubeThumbnail } from '../_lib/colors';
import type { VideoConfig, VideoProvider, VideoStyle } from '../_types';

export type VideoSectionDevice = 'desktop' | 'tablet' | 'mobile';

interface VideoSectionSharedProps {
  config: VideoConfig;
  style: VideoStyle;
  tokens: VideoColorTokens;
  title?: string;
  context: 'preview' | 'site';
  isPreview?: boolean;
  device?: VideoSectionDevice;
}

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const toSafeHref = (value?: string) => {
  const href = (value ?? '').trim();
  if (!href) {return '#';}

  if (
    href.startsWith('/')
    || href.startsWith('#')
    || href.startsWith('mailto:')
    || href.startsWith('tel:')
    || href.startsWith('http://')
    || href.startsWith('https://')
  ) {
    return href;
  }

  return '#';
};

const toText = (value: unknown, fallback = '') => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
};

const getCardTextClass = (device: VideoSectionDevice, compact = false) => {
  if (compact || device === 'mobile') {return 'text-sm';}
  if (device === 'tablet') {return 'text-[15px]';}
  return 'text-base';
};

const getHeadingClass = (device: VideoSectionDevice, small = false) => {
  if (small || device === 'mobile') {return 'text-xl';}
  if (device === 'tablet') {return 'text-2xl';}
  return 'text-3xl';
};

const SectionHeading = ({
  heading,
  description,
  tokens,
  device,
  centered = false,
  useSecondaryForDescription = false,
}: {
  heading: string;
  description: string;
  tokens: VideoColorTokens;
  device: VideoSectionDevice;
  centered?: boolean;
  useSecondaryForDescription?: boolean;
}) => {
  if (!heading && !description) {return null;}

  const descriptionColor = useSecondaryForDescription ? tokens.secondaryCtaText : tokens.mutedText;

  return (
    <div className={cn('space-y-2', centered ? 'text-center mx-auto max-w-3xl' : 'text-left')}>
      {heading ? (
        <h2 className={cn('font-bold tracking-tight', getHeadingClass(device))} style={{ color: tokens.heading }}>
          {heading}
        </h2>
      ) : null}
      {description ? (
        <p className={cn('leading-relaxed', getCardTextClass(device))} style={{ color: descriptionColor }}>
          {description}
        </p>
      ) : null}
    </div>
  );
};

function VideoSurface({
  videoUrl,
  thumbnailUrl,
  provider,
  title,
  tokens,
  isPlaying,
  onPlay,
  ratioClass = 'aspect-video',
  playSize = 'lg',
  roundedClass = 'rounded-xl',
}: {
  videoUrl: string;
  thumbnailUrl: string;
  provider: VideoProvider;
  title: string;
  tokens: VideoColorTokens;
  isPlaying: boolean;
  onPlay: () => void;
  ratioClass?: string;
  playSize?: 'sm' | 'lg';
  roundedClass?: string;
}) {
  if (!videoUrl) {
    return (
      <div
        className={cn('w-full flex flex-col items-center justify-center border', ratioClass, roundedClass)}
        style={{ backgroundColor: tokens.videoPlaceholder, borderColor: tokens.neutralBorder }}
      >
        <VideoIcon size={42} style={{ color: tokens.iconText }} />
        <p className="mt-2 text-sm" style={{ color: tokens.mutedText }}>Chưa có video</p>
      </div>
    );
  }

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn('relative overflow-hidden border', ratioClass, roundedClass)} style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.videoSurface }}>
      {!isPlaying ? (
        <>
          {thumbnailUrl && !imgError ? (
            <img 
              src={thumbnailUrl} 
              alt={title || 'Video thumbnail'} 
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: tokens.videoPlaceholder }}>
              <VideoIcon size={54} style={{ color: tokens.iconText }} />
            </div>
          )}
          <button
            type="button"
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center group"
            style={{ backgroundColor: tokens.sectionOverlay }}
            aria-label="Phát video"
          >
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full transition-colors',
                playSize === 'lg' ? 'h-16 w-16 md:h-20 md:w-20' : 'h-12 w-12',
              )}
              style={{ 
                backgroundColor: tokens.playButtonBackground, 
                color: tokens.playButtonText,
                '--hover-bg': tokens.playButtonHover,
              } as React.CSSProperties}
            >
              <Play className={cn(playSize === 'lg' ? 'h-8 w-8' : 'h-5 w-5', 'translate-x-[1px]')} fill="currentColor" />
            </span>
          </button>
        </>
      ) : (
        <VideoEmbed videoUrl={videoUrl} provider={provider} title={title} />
      )}
    </div>
  );
}

function VideoEmbed({
  videoUrl,
  provider,
  title,
}: {
  videoUrl: string;
  provider: VideoProvider;
  title: string;
}) {
  const info = getVideoInfo(videoUrl);

  if (provider === 'youtube' && info.id) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (provider === 'vimeo' && info.id) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${info.id}?autoplay=1`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (provider === 'drive' && info.id) {
    return (
      <iframe
        src={`https://drive.google.com/file/d/${info.id}/preview`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }

  if (!videoUrl) {
    return null;
  }

  return (
    <video
      src={videoUrl}
      className="absolute inset-0 h-full w-full object-cover"
      controls
      autoPlay
      playsInline
      muted
    />
  );
}

export function VideoSectionShared({
  config,
  style,
  tokens,
  title,
  context,
  isPreview = false,
  device = 'desktop',
}: VideoSectionSharedProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    setIsPlaying(false);
  }, [
    config.videoUrl,
    config.thumbnailUrl,
    config.autoplay,
    config.loop,
    config.muted,
    style,
  ]);

  const heading = toText(config.heading, toText(title));
  const description = toText(config.description);
  const badge = toText(config.badge);
  const buttonText = toText(config.buttonText);
  const buttonLink = toSafeHref(config.buttonLink);
  const safeVideoUrl = toText(config.videoUrl);
  const info = getVideoInfo(safeVideoUrl);
  const fallbackThumbnail = info.type === 'youtube' && info.id ? getYouTubeThumbnail(info.id) : '';
  const thumbnail = toText(config.thumbnailUrl) || fallbackThumbnail;
  const provider = info.type;

  const renderBadge = () => (
    badge ? (
      <span
        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: tokens.badgeBackground,
          color: tokens.badgeText,
          borderColor: tokens.badgeBorder,
        }}
      >
        {badge}
      </span>
    ) : null
  );

  const renderButton = (compact = false) => (
    buttonText ? (
      <a
        href={buttonLink}
        target={isExternalUrl(buttonLink) ? '_blank' : undefined}
        rel={isExternalUrl(buttonLink) ? 'noopener noreferrer' : undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
          compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm',
        )}
        style={{ 
          backgroundColor: tokens.ctaBackground, 
          color: tokens.ctaText,
          '--hover-bg': tokens.ctaHover,
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = tokens.ctaHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = tokens.ctaBackground;
        }}
      >
        {buttonText}
      </a>
    ) : null
  );

  const ContainerTag = context === 'site' ? 'section' : 'div';

  if (style === 'centered') {
    return (
      <ContainerTag className={cn('px-4', isPreview ? 'py-8' : 'py-12 md:py-16')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <SectionHeading heading={heading} description={description} tokens={tokens} device={device} centered useSecondaryForDescription />
          <VideoSurface
            videoUrl={safeVideoUrl}
            thumbnailUrl={thumbnail}
            provider={provider}
            title={heading || title || 'Video'}
            tokens={tokens}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
          />
        </div>
      </ContainerTag>
    );
  }

  if (style === 'split') {
    return (
      <ContainerTag className={cn('px-4', isPreview ? 'py-8' : 'py-12 md:py-16')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
          <VideoSurface
            videoUrl={safeVideoUrl}
            thumbnailUrl={thumbnail}
            provider={provider}
            title={heading || title || 'Video'}
            tokens={tokens}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            playSize="sm"
          />
          <div className="space-y-4">
            {renderBadge()}
            <SectionHeading heading={heading} description={description} tokens={tokens} device={device} useSecondaryForDescription />
            {renderButton()}
          </div>
        </div>
      </ContainerTag>
    );
  }

  if (style === 'fullwidth') {
    return (
      <ContainerTag className="relative">
        <div className={cn('relative overflow-hidden', isPreview ? 'aspect-[16/9]' : 'aspect-[21/9] min-h-[360px]')}>
          {!isPlaying ? (
            <>
              {thumbnail ? (
                <img src={thumbnail} alt={heading || title || 'Video'} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ backgroundColor: tokens.videoPlaceholder }} />
              )}
              <div className="absolute inset-0" style={{ backgroundColor: tokens.sectionOverlay }} />
              <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-4 py-8">
                <div className="max-w-2xl space-y-4">
                  {renderBadge()}
                  {heading ? <h2 className={cn('font-bold text-white', getHeadingClass(device))}>{heading}</h2> : null}
                  {description ? (
                    <p className={cn('leading-relaxed', getCardTextClass(device))} style={{ color: tokens.secondaryTextOnDark }}>
                      {description}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ 
                      backgroundColor: tokens.playButtonBackground, 
                      color: tokens.playButtonText,
                      '--hover-bg': tokens.playButtonHover,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = tokens.playButtonHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = tokens.playButtonBackground;
                    }}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    {buttonText || 'Xem video'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <VideoEmbed videoUrl={safeVideoUrl} provider={provider} title={heading || title || 'Video'} />
          )}
        </div>
      </ContainerTag>
    );
  }

  if (style === 'cinema') {
    return (
      <ContainerTag className={cn('px-4', isPreview ? 'py-8' : 'py-12 md:py-16')} style={{ backgroundColor: tokens.frameBackground }}>
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-3 text-center">
            {renderBadge()}
            {heading ? <h2 className={cn('font-bold text-white', getHeadingClass(device))}>{heading}</h2> : null}
            {description ? (
              <p className={cn('mx-auto max-w-3xl leading-relaxed', getCardTextClass(device))} style={{ color: tokens.secondaryTextOnDark }}>
                {description}
              </p>
            ) : null}
          </div>
          <VideoSurface
            videoUrl={safeVideoUrl}
            thumbnailUrl={thumbnail}
            provider={provider}
            title={heading || title || 'Video'}
            tokens={tokens}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            ratioClass="aspect-[21/9]"
            roundedClass="rounded-lg"
          />
          {renderButton() ? <div className="text-center">{renderButton()}</div> : null}
        </div>
      </ContainerTag>
    );
  }

  if (style === 'minimal') {
    return (
      <ContainerTag className={cn('px-4', isPreview ? 'py-8' : 'py-12 md:py-16')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
            <VideoSurface
              videoUrl={safeVideoUrl}
              thumbnailUrl={thumbnail}
              provider={provider}
              title={heading || title || 'Video'}
              tokens={tokens}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
            />
            {(heading || description || badge || buttonText) ? (
              <div className="space-y-3 border-t p-4 md:p-6" style={{ borderColor: tokens.cardBorder }}>
                {renderBadge()}
                <SectionHeading heading={heading} description={description} tokens={tokens} device={device} useSecondaryForDescription />
                {renderButton(true)}
              </div>
            ) : null}
          </div>
        </div>
      </ContainerTag>
    );
  }

  return (
    <ContainerTag className="relative">
      <div className={cn('relative overflow-hidden', isPreview ? 'min-h-[320px]' : 'min-h-[420px] md:min-h-[500px]')}>
        {!isPlaying ? (
          <>
            {thumbnail ? (
              <img src={thumbnail} alt={heading || title || 'Video'} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: tokens.videoPlaceholder }} />
            )}
            <div className="absolute inset-0" style={{ backgroundColor: tokens.sectionOverlay }} />
            <div className={cn('absolute inset-x-4 z-10', isPreview ? 'bottom-4' : 'bottom-6 md:bottom-10')}>
              <div className="mx-auto max-w-2xl rounded-xl border p-4 md:p-6" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <div className="space-y-3">
                  {renderBadge()}
                  {heading ? <h2 className={cn('font-bold', getHeadingClass(device, true))} style={{ color: tokens.heading }}>{heading}</h2> : null}
                  {description ? <p className={cn(getCardTextClass(device, true))} style={{ color: tokens.secondaryCtaText }}>{description}</p> : null}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                    style={{ 
                      backgroundColor: tokens.playButtonBackground, 
                      color: tokens.playButtonText,
                      '--hover-bg': tokens.playButtonHover,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = tokens.playButtonHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = tokens.playButtonBackground;
                    }}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    {buttonText || 'Xem video'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <VideoEmbed videoUrl={safeVideoUrl} provider={provider} title={heading || title || 'Video'} />
        )}
      </div>
    </ContainerTag>
  );
}

export const VIDEO_STYLE_META: Record<VideoStyle, { label: string; ratioHint: string }> = {
  centered: { label: 'Centered', ratioHint: '1280×720 (16:9)' },
  split: { label: 'Split', ratioHint: '1280×720 (16:9)' },
  fullwidth: { label: 'Fullwidth', ratioHint: '1920×820 (21:9)' },
  cinema: { label: 'Cinema', ratioHint: '1920×820 (21:9)' },
  minimal: { label: 'Minimal', ratioHint: '1280×720 (16:9)' },
  parallax: { label: 'Parallax', ratioHint: '1920×1080 (16:9)' },
};
