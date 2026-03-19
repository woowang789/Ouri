import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const primaryLightColor = useThemeColor({}, 'primaryLight');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

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
          <View style={[styles.avatar, { backgroundColor: primaryLightColor }]}>
            <ThemedText style={[Typography.heading1, { color: primaryColor }]}>
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
            <View style={styles.driveTitleRow}>
              <View style={[styles.driveIconBg, { backgroundColor: primaryLightColor }]}>
                <Ionicons name="cloud" size={16} color={primaryColor} />
              </View>
              <ThemedText style={Typography.bodyBold}>Google Drive</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: successColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: successColor }]} />
              <ThemedText style={[Typography.small, { color: successColor, fontWeight: '600' }]}>
                연동됨
              </ThemedText>
            </View>
          </View>

          <View style={styles.driveUsage}>
            <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
              {driveUsed}GB / {driveTotal}GB 사용 중
            </ThemedText>
            <ThemedText style={[Typography.captionBold, { color: primaryColor }]}>
              {Math.round(drivePercent * 100)}%
            </ThemedText>
          </View>

          {/* 프로그레스 바 */}
          <View style={[styles.progressTrack, { backgroundColor: surfaceMutedColor }]}>
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

        {/* 설정 메뉴 */}
        <Card style={styles.menuCard}>
          {[
            { icon: 'notifications-outline' as const, label: '알림 설정' },
            { icon: 'help-circle-outline' as const, label: '도움말' },
            { icon: 'information-circle-outline' as const, label: '앱 정보' },
          ].map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.menuItem,
                idx > 0 && { borderTopWidth: 0.5, borderTopColor: borderColor },
              ]}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={20} color={placeholderColor} />
                <ThemedText style={Typography.body}>{item.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={placeholderColor} />
            </View>
          ))}
        </Card>

        {/* 로그아웃 */}
        <Button
          title="로그아웃"
          variant="text"
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
    paddingBottom: 120,
  },
  profileCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
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
  driveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  driveIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  driveUsage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoutButton: {
    marginTop: Spacing.sm,
  },
});
