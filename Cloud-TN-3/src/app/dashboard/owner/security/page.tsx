'use client';

import { redirect } from 'next/navigation';
import SecurityLayout from './layout';

/**
 * Owner Security Main Page
 *
 * Redirects to /dashboard/owner/security/rbac (RBAC dashboard)
 */

export default function SecurityPage() {
  redirect('/dashboard/owner/security/rbac');
}
