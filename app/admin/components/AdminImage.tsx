import Image, { type ImageProps } from 'next/image';

type AdminImageProps = ImageProps & {
  unoptimized?: boolean;
};

export function AdminImage({ unoptimized = true, ...props }: AdminImageProps) {
  return <Image unoptimized={unoptimized} {...props} />;
}
