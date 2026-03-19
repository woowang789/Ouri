import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function MypageScreen() {
  const { user, mockLogout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const successColor = useThemeColor({}, 'success');
  const borderColor = useThemeColor({}, 'border');

  // Mock Drive 용량 데이터
  const driveUsed = 2.3;
  const driveTotal = 15;
  const drivePercent = driveUsed / driveTotal;

  // 이니셜 아바타
  const initial = user?.nickname?.charAt(0) ?? '?';

  // 가입일 포맷
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 섹션 */}
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
            <ThemedText style={[Typography.heading1, { color: '#fff' }]}>
              {initial}
            </ThemedText>
          </View>
          <ThemedText style={Typography.heading3}>{user?.nickname}</ThemedText>
          <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
            {joinDate} 가입
          </ThemedText>
        </Card>

        {/* Drive 상태 섹션 */}
        <Card style={styles.driveCard}>
          <View style={styles.driveHeader}>
            <ThemedText style={Typography.bodyBold}>Google Drive</ThemedText>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: successColor }]} />
              <ThemedText style={[Typography.caption, { color: successColor }]}>
                연동됨
              </ThemedText>
            </View>
          </View>

          <View style={styles.driveUsage}>
            <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
              {driveUsed}GB / {driveTotal}GB 사용 중
            </ThemedText>
          </View>

          {/* 프로그레스 바 */}
          <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: primaryColor,
                  width: `${drivePercent * 100}%`,
                },
              ]}
            />
          </View>
        </Card>

        {/* 로그아웃 */}
        <Button
          title="로그아웃"
          variant="outline"
          onPress={() => setShowLogoutDialog(true)}
          style={styles.logoutButton}
        />
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutDialog}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        destructive
        onConfirm={() => {
          setShowLogoutDialog(false);
          mockLogout();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  driveCard: {
    gap: Spacing.md,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  driveUsage: {
    flexDirection: 'row',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
