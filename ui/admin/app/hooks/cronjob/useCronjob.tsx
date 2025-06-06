import { toast } from "sonner";
import useSWR from "swr";

import { CronJobBase } from "~/lib/model/cronjobs";
import { CronJobApiService } from "~/lib/service/api/cronjobApiService";

import { useAsync } from "~/hooks/useAsync";

export function useCronjob(taskId?: string) {
	const getCronJobs = useSWR(
		...CronJobApiService.getCronJobs.swr({ filters: { taskId } })
	);

	const cronJobs = getCronJobs.data
		?.filter((cronJob) => cronJob.workflowName === taskId)
		.sort((cronJobA, cronJobB) => cronJobA.id.localeCompare(cronJobB.id));

	const createCronJob = useAsync(CronJobApiService.createCronJob, {
		onError: (error) => {
			if (error instanceof Error) toast.error("Something went wrong");
		},
		onSettled: () => {
			getCronJobs.mutate();
		},
	});

	const asyncUpdateCronJob = useAsync(CronJobApiService.updateCronJob, {
		onError: (error) => {
			if (error instanceof Error) toast.error("Something went wrong");
		},
		onSettled: () => {
			getCronJobs.mutate();
		},
	});

	const asyncDeleteCronJob = useAsync(CronJobApiService.deleteCronJob, {
		onError: (error) => {
			if (error instanceof Error) toast.error("Something went wrong");
		},
		onSettled: () => {
			getCronJobs.mutate();
		},
	});

	const updateCronJob = (cronJobId: string, cronJob: CronJobBase) => {
		const existingCronJobs = [...(getCronJobs.data ?? [])];
		const cronJobIndex = getCronJobs.data?.findIndex(
			(cronJob) => cronJob.id === cronJobId
		);
		if (cronJobIndex === undefined) return;

		existingCronJobs[cronJobIndex] = {
			...existingCronJobs[cronJobIndex],
			...cronJob,
		};
		// optimistic update on mutate, will be revalidated by SWR on request completion
		getCronJobs.mutate(existingCronJobs, { revalidate: false });
		asyncUpdateCronJob.execute(cronJobId, cronJob);
	};

	const deleteCronJob = (cronJobId: string) => {
		const existingCronJobs = getCronJobs.data ?? [];
		const expectedCronJobs = existingCronJobs.filter(
			(cronJob) => cronJob.id !== cronJobId
		);
		// optimistic update on mutate, will be revalidated by SWR on request completion
		getCronJobs.mutate(expectedCronJobs, { revalidate: false });
		asyncDeleteCronJob.execute(cronJobId);
	};

	return {
		cronJobs: cronJobs ?? [],
		createCronJob,
		updateCronJob,
		deleteCronJob,
	};
}
