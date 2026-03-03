import { ScrollView, StyleSheet, Text } from "react-native";

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.sectionTitle}>What We Store</Text>
      <Text style={styles.text}>
        ThriveTrack stores your mood entries, reflections, goals and wellbeing data
        securely in our database.
      </Text>

      <Text style={styles.sectionTitle}>How We Use Your Data</Text>
      <Text style={styles.text}>
        Your data is used only to display trends, summaries, reminders and exports
        within the app. We do not sell or share your data.
      </Text>

      <Text style={styles.sectionTitle}>Your Control</Text>
      <Text style={styles.text}>
        You can edit, delete, export, or permanently remove your account and all
        associated data at any time.
      </Text>

      <Text style={styles.sectionTitle}>Disclaimer</Text>
      <Text style={styles.text}>
        ThriveTrack is a wellbeing support tool and does not replace professional
        medical or psychological advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FDF6F8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});