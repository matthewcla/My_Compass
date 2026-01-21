import { Redirect } from 'expo-router';

export default function TabsIndex() {
    // Redirect root to assignments tab
    return <Redirect href="/assignments" />;
}
