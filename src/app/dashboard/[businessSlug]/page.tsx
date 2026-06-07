import { redirect } from 'next/navigation';

export default function DashboardSlugIndex({
  params,
}: {
  params: { businessSlug: string };
}) {
  redirect(`/dashboard/${params.businessSlug}/overview`);
}