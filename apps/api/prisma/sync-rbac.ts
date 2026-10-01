/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_MATRIX } from '../src/modules/auth/rbac.catalog';

const prisma = new PrismaClient();

async function main() {
  await prisma.permission.createMany({
    data: PERMISSIONS.map((key) => ({ key })),
    skipDuplicates: true,
  });
  const perms = await prisma.permission.findMany();
  const permByKey = new Map(perms.map((p) => [p.key, p.id]));

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log(`Syncing RBAC across ${companies.length} company(ies)…`);
  let grantsAdded = 0;

  for (const company of companies) {
    for (const [roleName, keys] of Object.entries(ROLE_MATRIX)) {
      const role = await prisma.role.findFirst({
        where: { companyId: company.id, name: roleName },
      });
      if (!role) continue;

      const grantKeys = keys === '*' ? [...PERMISSIONS] : keys;
      const desired = grantKeys
        .map((k) => permByKey.get(k))
        .filter((id): id is string => Boolean(id));
      const existing = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        select: { permissionId: true },
      });
      const have = new Set(existing.map((e) => e.permissionId));
      const missing = desired.filter((id) => !have.has(id));
      if (missing.length) {
        await prisma.rolePermission.createMany({
          data: missing.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
        grantsAdded += missing.length;
      }
    }
  }
  console.log(`✔ RBAC sync complete. ${grantsAdded} grant(s) added.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
