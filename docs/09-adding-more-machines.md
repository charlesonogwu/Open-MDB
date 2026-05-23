# 09 — Adding More Machines

Open MDB was designed so each new machine is a copy of the first, with zero cloud-side configuration.

## Per-New-Machine Checklist

1. **Hardware:** Buy a new Pi + Qibixx HAT + harness (~$300). See [`docs/01-bill-of-materials.md`](01-bill-of-materials.md).
2. **Database:** Add a row to `machines`:
   ```sql
   INSERT INTO machines (id, label, location_name)
     VALUES ('MACHINE-002', 'Warehouse Break Room', 'Distribution Center B');
   ```
3. **Slots:** Add rows to `slots` describing the coil layout and assigned products.
4. **Pi setup:** Flash, configure `MACHINE_ID=MACHINE-002` in the listener env, run the service.
5. **Verify:** Tail logs and perform a test vend. It should appear in the dashboard tagged `MACHINE-002`.

The cloud worker and dashboard need **no changes** — they handle any number of machines because they filter by `machine_id`.

## Naming Conventions

Pick a naming scheme up front and stick to it:

| Style | Example |
|-------|---------|
| Numeric | `MACHINE-001`, `MACHINE-002` |
| Location-coded | `OFFICE-MAIN`, `WAREHOUSE-EAST` |
| Sticker-numbered | matches a physical sticker on the machine |

Open MDB doesn't care which you use. The `label` and `location_name` fields are for human-readable display; `id` is the stable identifier.

## Decommissioning a Machine

When a machine is permanently removed from rotation:

```sql
UPDATE machines
   SET archived_at = now()
 WHERE id = 'MACHINE-XXX';
```

Historical `vends` data is preserved. The dashboard can filter out archived machines from active views while keeping the data queryable.

If you also want to delete historical data:

```sql
DELETE FROM vends   WHERE machine_id = 'MACHINE-XXX';
DELETE FROM slots   WHERE machine_id = 'MACHINE-XXX';
DELETE FROM machines WHERE id        = 'MACHINE-XXX';
```

## Multi-Operator Setups

If multiple operators share one Open MDB deployment, the schema needs scoping. Add an `owner_id` column to every table and update RLS policies to filter by `auth.uid()`. This is left as an exercise for advanced users.

## Next Step

[`docs/10-troubleshooting.md`](10-troubleshooting.md) — common issues and diagnosis.
