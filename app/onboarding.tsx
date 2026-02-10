import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "../src/constants/colors";

// ============================================
// ONBOARDING SCREEN
// ============================================
// Shown only on first app launch. Users swipe through
// 4 slides explaining key features, then tap "Get Started"
// to go to login/signup.
//
// We store a flag in SecureStore so the onboarding
// only shows once — returning users skip straight
// to login or home screen.
//
// FlatList with pagingEnabled creates the swipeable
// carousel effect — same pattern Instagram and
// most modern apps use for onboarding.

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "💰",
    title: "Track Every Expense",
    description:
      "Add expenses manually, use AI natural language entry, or import from CSV. Every dollar accounted for.",
  },
  {
    icon: "🧠",
    title: "Smart Auto-Categorization",
    description:
      "Our 3-layer engine automatically categorizes your expenses. It learns from your corrections and gets smarter over time.",
  },
  {
    icon: "📊",
    title: "Visual Analytics",
    description:
      "Beautiful charts show where your money goes. Set budgets, get alerts, and track spending predictions.",
  },
  {
    icon: "✨",
    title: "AI-Powered Insights",
    description:
      "Get personalized spending analysis, saving tips, and natural language expense entry powered by AI.",
  },
];

// Key used to check if onboarding was completed
export const ONBOARDING_KEY = "onboarding_complete";

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    // Mark onboarding as complete
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    router.replace("/(auth)/login");
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    router.replace("/(auth)/login");
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(_, index) => String(index)}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.slideIcon}>{item.icon}</Text>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
          </View>
        )}
      />

      {/* Bottom section: dots + button */}
      <View style={styles.bottom}>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={styles.button}
          onPress={isLastSlide ? handleGetStarted : handleNext}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  slideIcon: {
    fontSize: 80,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});