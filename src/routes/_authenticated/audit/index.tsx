import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  listAuditLogs,
  verifyAuditChain,
  type AuditLogWithId,
} from '@/features/history/services/auditLogService'
import { format } from 'date-fns'
import type { Timestamp } from 'firebase/firestore'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { usePagination } from '@/hooks/usePagination'

export const Route = createFileRoute('/_authenticated/audit/')({
  component: AuditLogPage,
})

function fmtTimestamp(ts: Timestamp | null | undefined) {
  if (!ts) return '—'
  try {
    return format(ts.toDate(), 'PPp')
  } catch {
    return '—'
  }
}

function AuditLogPage() {
  const { t } = useTranslation()
  const [verifyResult, setVerifyResult] = useState<
    { ok: true } | { ok: false; brokenAt: string; message: string } | null
  >(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit_log'],
    queryFn: () => listAuditLogs(100),
  })

  const entries: AuditLogWithId[] = data?.entries ?? []

  const { paged, PaginationBar } = usePagination(entries)

  const { mutate: runVerify, isPending: verifying } = useMutation({
    mutationFn: async () => {
      // Verify in ascending order (oldest first)
      const ascending = [...entries].reverse()
      return verifyAuditChain(ascending)
    },
    onSuccess: (result) => setVerifyResult(result),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('audit.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('audit.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runVerify()}
            disabled={verifying || entries.length === 0}
          >
            <ShieldCheck className="mr-2 size-4" />
            {verifying ? t('audit.verifying') : t('audit.verify')}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Verification result */}
      {verifyResult && (
        verifyResult.ok ? (
          <Alert className="flex items-center gap-2 border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
            <ShieldCheck className="size-4 shrink-0" />
            <span className="text-sm font-medium">
              {t('audit.verifySuccess', { n: entries.length })}
            </span>
          </Alert>
        ) : (
          <Alert variant="destructive" className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span className="text-sm font-medium">
              {t('audit.verifyFail', { id: verifyResult.brokenAt, message: verifyResult.message })}
            </span>
          </Alert>
        )
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.id')}</TableHead>
              <TableHead>{t('audit.col.timestamp')}</TableHead>
              <TableHead>{t('audit.col.user')}</TableHead>
              <TableHead>{t('audit.col.action')}</TableHead>
              <TableHead>{t('audit.col.entityType')}</TableHead>
              <TableHead>{t('audit.col.entityId')}</TableHead>
              <TableHead>{t('audit.col.details')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={7} />
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t('audit.empty')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.id}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {fmtTimestamp(entry.data.timestamp as Timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">{entry.data.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.data.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entry.data.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.data.entityId}</TableCell>
                  <TableCell className="max-w-xs">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(entry.data.details), null, 2)
                        } catch {
                          return entry.data.details
                        }
                      })()}
                    </pre>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar />

      {data?.lastDoc && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first 100 entries. Pagination not yet implemented.
        </p>
      )}
    </div>
  )
}
