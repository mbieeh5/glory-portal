import LoadingScreen from "@/components/LoadingScreen";
import MutationsAdmin from "@/components/MutationAdmin/MutationAdmin";
import { Suspense } from "react";



export default function bankRecap101() {

    return (
    <Suspense fallback={<LoadingScreen />}>
        <MutationsAdmin />
    </Suspense>
    )
}