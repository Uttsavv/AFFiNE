import { SettingRow } from '@affine/component/setting-components';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { Button } from '@toeverything/components/button';
import { useAsyncCallback } from '@toeverything/hooks/affine-async-hooks';
import {
  downloadProgressAtom,
  isCheckingForUpdatesAtom,
  updateAvailableAtom,
  updateReadyAtom,
  useAppUpdater,
} from '@toeverything/hooks/use-app-updater';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';

import { Loading } from '../../../../pure/workspace-slider-bar/workspace-card/loading-icon';
import * as styles from './style.css';

enum CheckUpdateStatus {
  UNCHECK = 'uncheck',
  LATEST = 'latest',
  UPDATE_AVAILABLE = 'update-available',
  ERROR = 'error',
}

const useUpdateStatusLabels = (checkUpdateStatus: CheckUpdateStatus) => {
  const t = useAFFiNEI18N();
  const isCheckingForUpdates = useAtomValue(isCheckingForUpdatesAtom);
  const updateAvailable = useAtomValue(updateAvailableAtom);
  const updateReady = useAtomValue(updateReadyAtom);
  const downloadProgress = useAtomValue(downloadProgressAtom);

  const buttonLabel = useMemo(() => {
    if (updateAvailable && downloadProgress === null) {
      return t['com.affine.aboutAFFiNE.checkUpdate.button.download']();
    }
    if (updateReady) {
      return t['com.affine.aboutAFFiNE.checkUpdate.button.restart']();
    }
    if (
      checkUpdateStatus === CheckUpdateStatus.LATEST ||
      checkUpdateStatus === CheckUpdateStatus.ERROR
    ) {
      return t['com.affine.aboutAFFiNE.checkUpdate.button.retry']();
    }
    return t['com.affine.aboutAFFiNE.checkUpdate.button.check']();
  }, [checkUpdateStatus, downloadProgress, t, updateAvailable, updateReady]);

  const subtitleLabel = useMemo(() => {
    if (updateAvailable && downloadProgress === null) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.update-available']({
        version: updateAvailable.version,
      });
    } else if (isCheckingForUpdates) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.checking']();
    } else if (updateAvailable && downloadProgress !== null) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.downloading']();
    } else if (updateReady) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.restart']();
    } else if (checkUpdateStatus === CheckUpdateStatus.ERROR) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.error']();
    } else if (checkUpdateStatus === CheckUpdateStatus.LATEST) {
      return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.latest']();
    }
    return t['com.affine.aboutAFFiNE.checkUpdate.subtitle.check']();
  }, [
    checkUpdateStatus,
    downloadProgress,
    isCheckingForUpdates,
    t,
    updateAvailable,
    updateReady,
  ]);

  const subtitle = useMemo(() => {
    return (
      <span
        className={clsx(styles.checkUpdateDesc, {
          active:
            updateReady ||
            (updateAvailable && downloadProgress === null) ||
            checkUpdateStatus === CheckUpdateStatus.LATEST,
          error: checkUpdateStatus === CheckUpdateStatus.ERROR,
        })}
      >
        {isCheckingForUpdates ? <Loading size={14} /> : null}
        {subtitleLabel}
      </span>
    );
  }, [
    checkUpdateStatus,
    downloadProgress,
    isCheckingForUpdates,
    subtitleLabel,
    updateAvailable,
    updateReady,
  ]);

  return { subtitle, buttonLabel };
};

export const UpdateCheckSection = () => {
  const t = useAFFiNEI18N();
  const { checkForUpdates, downloadUpdate, quitAndInstall } = useAppUpdater();
  const updateAvailable = useAtomValue(updateAvailableAtom);
  const updateReady = useAtomValue(updateReadyAtom);
  const downloadProgress = useAtomValue(downloadProgressAtom);
  const [checkUpdateStatus, setCheckUpdateStatus] = useState<CheckUpdateStatus>(
    CheckUpdateStatus.UNCHECK
  );

  const { buttonLabel, subtitle } = useUpdateStatusLabels(checkUpdateStatus);

  const asyncCheckForUpdates = useAsyncCallback(async () => {
    let statusCheck = CheckUpdateStatus.UNCHECK;
    try {
      const status = await checkForUpdates();

      if (status === null) {
        statusCheck = CheckUpdateStatus.ERROR;
      } else if (status === false) {
        statusCheck = CheckUpdateStatus.LATEST;
      } else if (typeof status === 'string') {
        statusCheck = CheckUpdateStatus.UPDATE_AVAILABLE;
      }
    } catch (e) {
      console.error(e);
      statusCheck = CheckUpdateStatus.ERROR;
    } finally {
      setCheckUpdateStatus(statusCheck);
    }
  }, [checkForUpdates]);

  const handleClick = useCallback(() => {
    if (updateAvailable && downloadProgress === null) {
      return downloadUpdate();
    }
    if (updateReady) {
      return quitAndInstall();
    }
    asyncCheckForUpdates();
  }, [
    asyncCheckForUpdates,
    downloadProgress,
    downloadUpdate,
    quitAndInstall,
    updateAvailable,
    updateReady,
  ]);

  return (
    <SettingRow
      name={t['com.affine.aboutAFFiNE.checkUpdate.title']()}
      desc={subtitle}
    >
      <Button
        data-testid="check-update-button"
        onClick={handleClick}
        disabled={downloadProgress !== null && !updateReady}
      >
        {buttonLabel}
      </Button>
    </SettingRow>
  );
};
