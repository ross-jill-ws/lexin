import { Alert, Button, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useLocation, useParams } from "react-router";
import { ApiClientError, ApiRequestError } from "../../api/client";
import type { ListReturnState } from "../materials/MaterialLink";
import { BackToRegister } from "../not-found/BackToRegister";
import { Notice } from "../not-found/Notice";
import classes from "./MaterialDetailPage.module.css";
import { MaterialFacts } from "./MaterialFacts";
import { useMaterial } from "./useMaterial";

/** /materials/:materialNumber: one material's full record. */
export function MaterialDetailPage() {
  const { materialNumber = "" } = useParams();
  const location = useLocation();
  const listSearch = (location.state as ListReturnState | null)?.listSearch ?? "";
  const { data: material, error, isFetching, refetch } = useMaterial(materialNumber);

  if (error instanceof ApiRequestError && error.status === 404) {
    return (
      <Notice code="404" eyebrow={materialNumber} title="Material not found">
        <Text c="graphite.6">{error.message}</Text>
        <BackToRegister search={listSearch} />
      </Notice>
    );
  }

  return (
    <>
      <div className={classes.top}>
        <BackToRegister search={listSearch} variant="subtle" />
        <span className={classes.crumb}>Register / {materialNumber}</span>
      </div>
      {error ? (
        <Alert color="red" title="Couldn't load this material" variant="outline">
          <Stack align="flex-start" gap="sm">
            <Text size="sm">
              {error instanceof ApiClientError ? error.message : "Something unexpected went wrong."}
            </Text>
            <Button color="red" variant="light" loading={isFetching} onClick={() => void refetch()}>
              Retry
            </Button>
          </Stack>
        </Alert>
      ) : (
        <article className={classes.sheet} aria-busy={!material}>
          <header className={classes.head}>
            <div>
              <span className={classes.tag}>{materialNumber}</span>
              {material ? (
                <Title order={1} className={classes.title}>
                  {material.description}
                </Title>
              ) : (
                <Skeleton height={44} width="60%" mt={12} />
              )}
            </div>
          </header>
          {material ? <MaterialFacts material={material} /> : <Skeleton height={320} radius={0} />}
        </article>
      )}
    </>
  );
}
